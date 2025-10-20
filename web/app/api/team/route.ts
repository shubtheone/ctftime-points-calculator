import "../_polyfill";
import { NextRequest, NextResponse } from "next/server";

// Minimal placeholder: fetch basic team info from CTFtime API.
// You can extend this to compute totals/top-N like your Flask code did.
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const teamId = url.searchParams.get("team_id");
  if (!teamId) return NextResponse.json({ error: "Missing team_id" }, { status: 400 });

  const res = await fetch(`https://ctftime.org/api/v1/teams/${teamId}/`, {
    headers: { "User-Agent": "Mozilla/5.0 (ctfcalc)" },
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json({ error: `CTFtime returned ${res.status}` }, { status: res.status });
  }
  const data = await res.json();
  return NextResponse.json({ team: data });
}