# Replay — Operation Bolo

A cinematic, documentary-style replay of Operation Bolo (2 January 1967), coded in this
repo. One React composition is the whole film: Remotion renders it to MP4, and
`@remotion/player` plays the same composition, scrubbable, inside the app.

**Status: M0 (look-dev spike).** The "Above the undercast" shot renders end to end: real
terrain, the computed sun, the cloud deck, an F-4C stand-in in SEA camouflage, the film
look and the overlays. The milestones are at the end of this page.

## How it works

- **Every frame is a function of its frame number.** Remotion renders frames out of order,
  in parallel tabs. So the scene keeps no state between frames: no particles, no temporal
  AA, and no trails accumulated frame by frame. Missile smoke (M3) is sampled from the
  missile's analytic path, and motion blur will come from sub-frames.
- **Real places, real light.** `src/replay/geo.ts` turns WGS84 into a local frame around a
  per-shot origin (a floating origin, so float32 stays precise). `src/replay/sun.ts` is
  NOAA's solar algorithm. Over Phuc Yen at 15:00 local (UTC+7) on 2 Jan 1967 the sun was
  27.8° up from 227° (SW), and it set at about 17:27. Tests pin these numbers.
- **One atmosphere.** `scene/atmosphere.tsx` holds the sun, haze and cloud deck as shared
  uniforms. The terrain, the deck, the aircraft and the sky all read the same objects, so
  they are lit and hazed the same way.
- **Radiometry matches three.js.** Surface radiance is irradiance × albedo / π, and sky and
  haze are given as radiance. The sky is an art-directed gradient whose horizon colour *is*
  the haze colour, so distant cloud fades into the sky without a seam. (A Preetham sky was
  tried first; its horizon never matched the deck.)
- **Same noise on every machine.** All shader noise hashes with integer PCG, not
  `fract(sin())`. sin() precision differs between GPUs and SwiftShader, so a sin hash
  would draw a different deck in the draft than in the final render.
- **The undercast** (`scene/CloudDeck.tsx`) is a 2.5-D sea of cloud tops: domes and
  billows, a short march towards the sun for self-shadowing, a forward-scattering rim, and
  holes whose edges sink. Coverage runs from broken over Thud Ridge to overcast over Phuc
  Yen. The terrain reads the same field, so cloud shadows land where the cloud is.
- **Liveries are data** (`scene/livery.ts`). The SEA camouflage is projected by the shader,
  so it needs no UVs, and any model takes the scheme. Markings the record does not support
  are not painted.

## The data

`content/replays/operation-bolo/scenario.json` is the record the film is drawn from:

- flights, actors (crews, call signs, serials), tracks and events;
- each with a `basis` (documented / inferred / illustrative) and its sources;
- each source marked `read`, `summary` or `not-yet`;
- the disagreements kept as `disputes`, each with the line the film shows until the
  primary record settles it.

Kill events must be documented and carry the weapon. Their *times* are illustrative
(`tBasis`) until the pilots' accounts in *Aces and Aerial Victories* pin them down.
`pnpm replay:check` (part of `pnpm check`) enforces this, together with the credits
ledger.

## Honesty

- The film always carries the line `RECONSTRUCTION · …`. Every event is marked ●
  documented or ◌ reconstructed, the same provenance dot the app uses.
- Terrain: the land cover is 2021, so built-up land is repainted as cropland. Water that
  did not exist in 1967 is repainted as land: the Núi Cốc reservoir was built in the
  1970s. `terrain.json` records both.
- Facts that the secondary sources disagree on stay "to verify" until checked against
  *Aces and Aerial Victories* (1976). Examples: 14:00 or 15:00, the flight list, the
  QRC-160 fit, the missile load and the January 1967 tail codes.
- `content/replays/operation-bolo/credits.json` has a row for every shipped asset. M1
  adds a check that fails the build on a file with no row or a licence outside the
  allowlist.

## Running it

```sh
pnpm replay:assets                       # download Copernicus + WorldCover, bake terrain tiles
pnpm replay:studio                       # Remotion Studio: scrub, tweak, preview
pnpm replay:still Undercast out.png --frame=150 --scale=0.5
pnpm replay:render Undercast out.mp4 --scale=0.5 --crf=18
```

`--props` toggles layers for debugging, e.g.
`--props='{"layers":{"deck":false,"post":false}}'`.

### In the cloud sandbox (no GPU)

Remotion cannot download its own browser here, so point it at Playwright's headless shell.
Renders use SwiftShader on the CPU: **drafts only**. Measured on the M0 shot:

- a 960×540 still takes about 15 s, a 1080p still about 35 s, each including start-up;
- the full 10 s draft (300 frames at 960×540, concurrency 2) took 46 min, about
  9.3 s per frame, with other jobs sharing the CPU.

```sh
export REMOTION_BROWSER=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
pnpm replay:render Undercast out.mp4 --scale=0.5
```

### On your desktop (GPU, final renders, asset downloads)

Install:

1. **Node 22+ and pnpm 10.** `corepack enable`, then `pnpm install` in the repo.
2. **Blender 4.2 LTS or newer.** Needed in M2 to turn the MiG-21 `.blend` into glTF and to
   clean up the downloaded models.
3. Optional: **ffmpeg**, for loudness normalisation and joining chunked renders. Remotion
   bundles its own ffmpeg for rendering itself.

Then render on the GPU:

```sh
pnpm replay:render Undercast out.mp4 --gl=angle            # 1080p
pnpm replay:render Undercast out-4k.mp4 --gl=angle --scale=2
```

Remotion fetches its Chrome Headless Shell on the desktop by itself. Long renders go in
frame-range chunks (`--frames=0-899`); Remotion documents ANGLE memory leaks on long
renders.

### Asset inbox (blocked from the sandbox — download on the desktop)

Put the files in `.cache/replay/inbox/` (gitignored). Before downloading, check each
model's licence on its own page. Rips from games are never acceptable, whatever the label
says.

| For | What | Licence to confirm |
|---|---|---|
| F-4C | Sketchfab "McDonnell Douglas F-4 Phantom II" by andertan — glTF | CC BY; confirm it is a C |
| MiG-21PFL | Sketchfab "MiG 21 Cel Shading (MiG-21PF Fishbed-D)" by HTQ — `.blend` from the author's link | CC BY-SA; the derivative stays CC BY-SA |
| Period map | AMS Series L509 1:250,000 sheet NF 48-11 "Hanoi" (1961) — ANU Open Research | US Government work; check the rights statement |
| Sources | *Aces and Aerial Victories: The USAF in Southeast Asia 1965–1973* (1976) — dafhistory.af.mil PDF | Public domain |
| Photos | NMUSAF *Operation Bolo* fact sheet and its USAF photos | Public domain |
| Sound | Freesound: J79 flyby, radio squelch, missile motor | CC0 / CC BY only |

## Milestones

| | | |
|---|---|---|
| M0 | Look-dev spike: "Above the undercast" | ✓ this branch |
| M1 | `scenario.json` + sources, Zod schema, `check-replay`, engine tests (track, timemap, captions) | ✓ data and checks; primary-source pass pending |
| M2 | Assets: terrain LODs, vectors, CC models with the livery shader, F-105 loft, credits audit | |
| M3 | Act III "The fight" end to end, plus `/replay/operation-bolo`, the `RPL` panel, the article | |
| M4 | Cold open, Acts I, II and IV, credits; full captions, VO slot | |
| M5 | 4K GPU render, loudnorm, captions sidecar, publish | |
