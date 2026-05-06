import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Behind a reverse proxy (Caddy in prod) `request.url` reflects the internal
// upstream URL (e.g. http://localhost:3333), not the public hostname. Build
// the redirect origin from x-forwarded-* when available so we don't bounce
// users to localhost after sign-out.
function getOrigin(request: Request): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) {
    const proto = request.headers.get("x-forwarded-proto") || "https";
    return `${proto}://${forwardedHost}`;
  }
  return new URL(request.url).origin;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(`${getOrigin(request)}/auth/sign-in`);
}
