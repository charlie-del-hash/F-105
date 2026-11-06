/**
 * Film time ↔ mission time, and the rules that keep captions readable.
 *
 * A shot plays a stretch of the mission at a rate: 1 for real time, 4 for a
 * compressed manoeuvre (the timecode then shows ×4), 0.5 for a slowed launch.
 */

export interface ShotTiming {
  id: string;
  /** First frame of the shot in the film. */
  from: number;
  durationInFrames: number;
  /** Mission time (s from T0) at the shot's first frame. */
  missionStart: number;
  /** Mission seconds per film second. */
  rate: number;
}

export function missionTime(shot: ShotTiming, frame: number, fps: number) {
  return shot.missionStart + ((frame - shot.from) / fps) * shot.rate;
}

/** The shot that owns a frame. Shots are contiguous; see shotProblems. */
export function shotAt(shots: ShotTiming[], frame: number) {
  return shots.find((s) => frame >= s.from && frame < s.from + s.durationInFrames);
}

/** Gaps, overlaps and bad rates in an edit, as messages. Empty means sound. */
export function shotProblems(shots: ShotTiming[], totalFrames: number): string[] {
  const out: string[] = [];
  const sorted = [...shots].sort((a, b) => a.from - b.from);
  let cursor = 0;
  for (const s of sorted) {
    if (s.from > cursor) out.push(`gap before ${s.id}: frames ${cursor}–${s.from - 1}`);
    if (s.from < cursor) out.push(`${s.id} overlaps the previous shot by ${cursor - s.from} frames`);
    if (s.durationInFrames <= 0) out.push(`${s.id} has no duration`);
    if (!(s.rate > 0)) out.push(`${s.id} has rate ${s.rate}`);
    cursor = Math.max(cursor, s.from + s.durationInFrames);
  }
  if (cursor < totalFrames) out.push(`gap at the end: frames ${cursor}–${totalFrames - 1}`);
  if (cursor > totalFrames) out.push(`edit runs ${cursor - totalFrames} frames past the end`);
  return out;
}

export interface Caption {
  id: string;
  /** Seconds in the film. */
  start: number;
  end: number;
  text: string;
}

export const CAPTION_RULES = { maxCharsPerSecond: 17, maxLineLength: 42, maxLines: 2, minSeconds: 1.5 } as const;

/** Greedy word wrap at a line length. */
export function wrapCaption(text: string, width: number = CAPTION_RULES.maxLineLength) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.trim().split(/\s+/)) {
    if (!line) line = word;
    else if (line.length + 1 + word.length <= width) line += ` ${word}`;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function captionProblems(c: Caption): string[] {
  const out: string[] = [];
  const seconds = c.end - c.start;
  const chars = c.text.replace(/\s+/g, " ").trim().length;
  if (seconds < CAPTION_RULES.minSeconds) out.push(`${c.id}: on screen ${seconds.toFixed(2)} s, needs ${CAPTION_RULES.minSeconds}`);
  if (seconds > 0 && chars / seconds > CAPTION_RULES.maxCharsPerSecond) out.push(`${c.id}: ${(chars / seconds).toFixed(1)} chars/s, limit ${CAPTION_RULES.maxCharsPerSecond}`);
  const lines = wrapCaption(c.text);
  if (lines.length > CAPTION_RULES.maxLines) out.push(`${c.id}: ${lines.length} lines at ${CAPTION_RULES.maxLineLength} chars, limit ${CAPTION_RULES.maxLines}`);
  return out;
}
