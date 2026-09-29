import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { isAuthorized, unauthorizedResponse } from "@/lib/app-auth";

export function proxy(request: NextRequest) {
  if (isAuthorized(request.headers.get("authorization"))) {
    return NextResponse.next();
  }

  return unauthorizedResponse();
}

export const config = {
  matcher: [
    /*
     * Protect pages and API. Skip Next internals and static public assets so
     * the browser can still load CSS/JS after the Basic-auth challenge.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
