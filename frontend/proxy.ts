import { NextResponse, type NextRequest } from "next/server";
import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_HEADER,
  isLocale,
  negotiateLocale,
} from "@/lib/locale";

// Decides the language of a page before it renders, so the first paint, the tab title and
// <html lang> are already right. Order: a ?lang= link, the device's saved choice, the
// browser's preference, English. The root layout reads the result from the x-locale header.
export function proxy(request: NextRequest) {
  const requested = request.nextUrl.searchParams.get("lang");
  const saved = request.cookies.get(LOCALE_COOKIE)?.value;

  const locale = isLocale(requested)
    ? requested
    : isLocale(saved)
      ? saved
      : negotiateLocale(request.headers.get("accept-language"));

  // Always overwritten, so a client cannot dictate the header
  const headers = new Headers(request.headers);
  headers.set(LOCALE_HEADER, locale);
  const response = NextResponse.next({ request: { headers } });

  // Only an explicit choice is remembered: a language guessed from the browser stays a
  // guess, and follows the browser if its settings change
  if (isLocale(requested)) {
    response.cookies.set(LOCALE_COOKIE, requested, {
      path: "/",
      maxAge: LOCALE_COOKIE_MAX_AGE,
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  // Pages only: skip Next.js internals, the favicon and anything with a file extension
  matcher: ["/((?!_next|favicon|.*\\..*).*)"],
};
