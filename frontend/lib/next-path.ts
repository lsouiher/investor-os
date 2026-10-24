// Where sign-in and registration may send the user back to (?next=). An exact-match allow-list,
// never "any path starting with /", which is the classic open redirect (research R5).
const ALLOWED_NEXT = ["/import"];

export function safeNextPath(value: string | null): string | null {
  return value !== null && ALLOWED_NEXT.includes(value) ? value : null;
}
