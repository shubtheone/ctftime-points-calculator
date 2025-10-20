import "../_polyfill";
import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const res = await fetch(`https://ctftime.org/event/${id}/`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (ctfcalc)",
      Accept: "text/html",
    },
    // CTFtime sometimes blocks HEAD; force GET
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json({ error: `CTFtime returned ${res.status}` }, { status: res.status });
  }

  const html = await res.text();
  // Try a few patterns for the weight number
  const patterns = [
    /Weight:\s*([0-9.]+)/i,
    /Rating weight:\s*([0-9.]+)/i,
    /rating weight[^0-9]*([0-9.]+)/i,
  ];
  let weight: number | null = null;
  for (const rx of patterns) {
    const m = html.match(rx);
    if (m) {
      weight = parseFloat(m[1]);
      break;
    }
  }

  // Fallback: try to parse via Cheerio if page structure changes
  if (weight == null) {
    const $ = cheerio.load(html);
    const text = $("body").text();
    const m = text.match(/Weight:\s*([0-9.]+)/i);
    if (m) weight = parseFloat(m[1]);
  }

  return NextResponse.json({ weight });
}