/** Transport contract the comfort layer depends on. The live implementation lives in server/qloo-http.ts. */
export type QlooResponse = { status: number; body: unknown; ms: number; cached: boolean };
export type QlooParams = Record<string, string | number | boolean | undefined | null>;

export interface QlooTransport {
  get(path: string, params: QlooParams): Promise<QlooResponse>;
  /** POST with a JSON body of dotted Qloo parameter names (used for weighted signals). */
  post(path: string, body: Record<string, unknown>): Promise<QlooResponse>;
}

export class QlooUnavailableError extends Error {
  constructor(message = "Qloo is not configured on this server") {
    super(message);
    this.name = "QlooUnavailableError";
  }
}

export function cleanParams(params: QlooParams): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    out[k] = String(v);
  }
  return out;
}
