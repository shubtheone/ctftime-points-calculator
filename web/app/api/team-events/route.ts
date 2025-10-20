import "../_polyfill";
import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

type TeamEvent = {
  place: string;
  event_name: string;
  rating_points: number;
  is_hosted: boolean;
  event_link?: string | null;
};

export const dynamic = "force-dynamic";

function toAbsolute(link: string | null | undefined): string | null {
  if (!link) return null;
  if (link.startsWith("http")) return link;
  return `https://ctftime.org${link}`;
}

function parseTeamEvents(html: string): TeamEvent[] {
  const $ = cheerio.load(html);
  const table = $("table.table-striped");
  if (!table.length) return [];
  const rows = table.find("tr").slice(1);
  const events: TeamEvent[] = [];
  rows.each((_, row) => {
    const cols = $(row).find("td");
    if (cols.length !== 5) return;
    const place = $(cols[1]).text().trim();
    const eventCell = $(cols[2]);
    const event_name = eventCell.text().trim();
    const linkEl = eventCell.find("a").first();
  const event_link = linkEl.length ? toAbsolute(linkEl.attr("href")) : null;
    const rating_raw = $(cols[4]).text().trim();
    const is_hosted = rating_raw.includes("*");
    const rating_points = parseFloat(rating_raw.replace("*", ""));
    if (!Number.isFinite(rating_points)) return;
    events.push({ place, event_name, rating_points, is_hosted, event_link });
  });
  events.sort((a, b) => b.rating_points - a.rating_points);
  return events;
}

async function fetchEventWeight(id: string): Promise<number | null> {
  const res = await fetch(`https://ctftime.org/event/${id}/`, {
    headers: { "User-Agent": "Mozilla/5.0 (ctfcalc)", Accept: "text/html" },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const html = await res.text();
  const patterns = [/Weight:\s*([0-9.]+)/i, /Rating weight:\s*([0-9.]+)/i];
  for (const rx of patterns) {
    const m = html.match(rx);
    if (m) return parseFloat(m[1]);
  }
  const $ = cheerio.load(html);
  const text = $("body").text();
  const m = text.match(/Weight:\s*([0-9.]+)/i);
  return m ? parseFloat(m[1]) : null;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const team_id = String(body.team_id || "").trim();
  const top_n = Math.max(0, Math.trunc(Number(body.top_n || 10)));
  const include_hosted = Boolean(body.include_hosted);
  const event_id = String(body.event_id || "").trim();

  if (!team_id) {
    return NextResponse.json({ error: "Please provide a team ID (e.g., 123456)." }, { status: 400 });
  }

  const res = await fetch(`https://ctftime.org/team/${team_id}`, {
    headers: { "User-Agent": "Mozilla/5.0 (ctfcalc)", Accept: "text/html" },
    cache: "no-store",
  });
  if (!res.ok) {
    return NextResponse.json({ error: `CTFtime returned ${res.status}` }, { status: res.status });
  }
  const html = await res.text();
  const all = parseTeamEvents(html);
  const base = all.filter((e) => !e.is_hosted);
  const baseSorted = base.slice().sort((a, b) => b.rating_points - a.rating_points);
  const baseTop = baseSorted.slice(0, top_n);
  const baseTotal = baseTop.reduce((s, e) => s + e.rating_points, 0);

  let event_weight: number | null = null;
  let hosted_points: number | null = null;
  let top = baseTop;
  let total = baseTotal;

  if (include_hosted && event_id) {
    event_weight = await fetchEventWeight(event_id);
    if (typeof event_weight === "number") {
      hosted_points = 2 * event_weight;
      const hostedEvent: TeamEvent = {
        place: "host",
        event_name: `Your hosted event - ${event_id}`,
        rating_points: hosted_points,
        is_hosted: true,
        event_link: `https://ctftime.org/event/${event_id}`,
      };
      const candidate = base.concat([hostedEvent]);
      candidate.sort((a, b) => b.rating_points - a.rating_points);
      top = candidate.slice(0, top_n);
      total = top.reduce((s, e) => s + e.rating_points, 0);
    }
  }

  return NextResponse.json({ top, total, event_weight, hosted_points });
}
