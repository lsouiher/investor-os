// Remembers which link brought a visitor here (?utm_source=bpcon, ?utm_source=qr, or ?ref=recs
// from a RECS calculator) until they register, so the funnel can tell the email list from the
// QR code and RECS. utm_source wins over ref, and ref counts only as ref=recs (other sites append
// their own ?ref=). Session-scoped: closing the tab forgets it, and nothing else reads it.
const KEY = "investoros_signup_source";

export function rememberSignupSource(search: string): void {
  try {
    const params = new URLSearchParams(search);
    const ref = params.get("ref")?.trim().toLowerCase();
    const source = params.get("utm_source")?.trim().toLowerCase() || (ref === "recs" ? ref : undefined);
    if (source && /^[a-z0-9_-]{1,32}$/.test(source)) sessionStorage.setItem(KEY, source);
  } catch {
    // sessionStorage unavailable (private mode quirks): the signup just has no source
  }
}

export function clearSignupSource(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // nothing held
  }
}

export function takeSignupSource(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}
