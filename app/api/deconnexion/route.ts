import { NextResponse } from "next/server";
import { fermerSession } from "@/lib/session";

export async function POST(request: Request) {
  await fermerSession();
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
