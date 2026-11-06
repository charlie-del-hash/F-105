/**
 * Remotion compositions for the replay. Studio: `pnpm replay:studio`.
 * Renders: `pnpm replay:still` / `pnpm replay:render` (see docs/REPLAY.md).
 */
import { Composition } from "remotion";
import { Undercast } from "../src/replay/compositions/Undercast";
import { UNDERCAST_FPS, UNDERCAST_SECONDS } from "../src/replay/shots/undercast";

export function RemotionRoot() {
  return (
    <>
      <Composition
        id="Undercast"
        component={Undercast}
        durationInFrames={UNDERCAST_FPS * UNDERCAST_SECONDS}
        fps={UNDERCAST_FPS}
        width={1920}
        height={1080}
      />
    </>
  );
}
