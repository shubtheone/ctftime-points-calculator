import "../_polyfill";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function toFloat(v: unknown): number {
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : 0;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const weight = toFloat(body.weight);
  const total_teams = Math.max(0, Math.trunc(toFloat(body.total_teams)));
  const best_points = toFloat(body.best_points);
  const team_place = Math.max(0, Math.trunc(toFloat(body.team_place)));
  const team_points = toFloat(body.team_points);

  const points_coef = best_points > 0 ? team_points / best_points : 0;
  const place_coef = team_place > 0 ? 1 / team_place : 0;
  let result = 0;
  if (points_coef > 0) {
    const denom = total_teams > 0 ? 1 / (1 + team_place / total_teams) : 0;
    if (denom !== 0) {
      result = ((points_coef + place_coef) * weight) / denom;
    }
  }

  return NextResponse.json({ result });
}
