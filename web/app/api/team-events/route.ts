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

function toAbsolute(link?: string | null): string | null {
  if (!link) return null;
  if (link.startsWith("http")) return link;
  return `https://ctftime.org${link}`;
}

function parseTeamEvents(html: string): TeamEvent[] {
  const $ = cheerio.load(html);
  const table = $("table.table-striped").first();
  if (!table.length) return [];
  const rows = table.find("tr").slice(1);

  const events: TeamEvent[] = [];
  rows.each((_, row) => {
    const tds = $(row).find("td");
    if (tds.length < 5) return;

    const place = $(tds[0]).text().trim();
    const nameCell = $(tds[1]);
    const event_name = nameCell.text().trim();
    const event_link = toAbsolute(nameCell.find("a").attr("href") || null);

    // Rating points often in the last or 2nd last column
    const ptsText =
      $(tds[tds.length - 1]).text().trim() ||
      $(tds[tds.length - 2]).text().trim();
    const rating_points = parseFloat(ptsText || "0") || 0;

    events.push({
      place,
      event_name,
      rating_points,
      is_hosted: false,
      event_link,
    });
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
  const m =
    html.match(/Weight:\s*([0-9.]+)/i) ||
    html.match(/Rating weight:\s*([0-9.]+)/i);
  return m ? parseFloat(m[1]) : null;
}

export async function POST(req: NextRequest) {
  try {
    const { team_id, top_n = 10, include_hosted = false, hosted_event_id } =
      await req.json();

    if (!team_id) {
      return NextResponse.json({ error: "Missing team_id" }, { status: 400 });
    }

    const res = await fetch(`https://ctftime.org/team/${team_id}/`, {
      headers: { "User-Agent": "Mozilla/5.0 (ctfcalc)", Accept: "text/html" },
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `CTFtime returned ${res.status}` },
        { status: res.status }
      );
    }

    const html = await res.text();
    let events = parseTeamEvents(html);

    // Optional hosted event injection (approximation: points = weight * 2)
    if (include_hosted && hosted_event_id) {
      const weight = await fetchEventWeight(String(hosted_event_id));
      if (weight && weight > 0) {
        events.push({
          place: "host",
          event_name: `Hosted event ${hosted_event_id}`,
          rating_points: weight * 2,
          is_hosted: true,
          event_link: `https://ctftime.org/event/${hosted_event_id}/`,
        });
      }
    }

    const top = events.slice(0, Number(top_n) || 10);
    const total = top.reduce((s, e) => s + (e.rating_points || 0), 0);

    return NextResponse.json({ events, top, total });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}
