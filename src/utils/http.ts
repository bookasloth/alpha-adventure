import { NextResponse } from "next/server";

// Standard API/action response envelope (see docs/V2_DECISIONS.md).
// Success: { ok: true, data }. Failure: { ok: false, error: { code, message } }.
// User-facing messages only; log details server-side, never leak them here.

export type ApiOk<T> = { ok: true; data: T };
export type ApiErr = { ok: false; error: { code: string; message: string } };
export type ApiResult<T> = ApiOk<T> | ApiErr;

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json<ApiOk<T>>({ ok: true, data }, { status });
}

export function jsonFail(message: string, code = "bad_request", status = 400) {
  return NextResponse.json<ApiErr>({ ok: false, error: { code, message } }, { status });
}
