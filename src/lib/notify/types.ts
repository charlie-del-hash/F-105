import type { AlertEvent, Channel } from "@/alerts/schema";
import type { FetchLike } from "@/data/types";

export interface Notifier {
  readonly id: Channel;
  readonly configured: boolean;
  /** Why it is not configured, for the run summary. */
  readonly missing?: string;
  send(event: AlertEvent): Promise<void>;
}

export type Env = Record<string, string | undefined>;
export type NotifierFactory = (opts?: { fetchImpl?: FetchLike; env?: Env }) => Notifier;
export const defaultFetch: FetchLike = (u, i) => fetch(u, i);
