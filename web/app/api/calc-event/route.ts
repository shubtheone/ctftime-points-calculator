import "../_polyfill";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const preferredRegion = ["sfo1", "cdg1", "hnd1"];

function toFloat(v: unknown): number {
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : 0;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const weight = toFloat(body.weight);
  const best_points = toFloat(body.best_points);
  const team_place = Math.trunc(toFloat(body.team_place));
  const team_points = toFloat(body.team_points);

  // Validation per corrected formula semantics
  if (!(best_points > 0)) {
    return NextResponse.json(
      { error: "Best team points must be greater than zero." },
      { status: 400 }
    );
  }
  if (!(team_place > 0)) {
    return NextResponse.json(
      { error: "Team place must be >= 1." },
      { status: 400 }
    );
  }

  const points_coef = team_points / best_points;
  const place_coef = 1 / team_place;
  const result = (points_coef + place_coef) * weight;

  return NextResponse.json({ result, points_coef, place_coef });
}
