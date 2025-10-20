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

export const runtime = "nodejs";
export const preferredRegion = ["sfo1", "cdg1", "hnd1"];
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

async function fetchOrganizerPointsFromCTFtime(teamId: string, year?: number): Promise<{ points: number | null; year: number | null }> {
  const y = year ?? new Date().getUTCFullYear();
  const res = await fetch(`https://ctftime.org/api/v1/teams/${teamId}/`, {
    headers: { "User-Agent": "Mozilla/5.0 (ctfcalc)" },
    cache: "no-store",
    // CTFtime requires JSON; this is a public API endpoint
  });
  if (!res.ok) return { points: null, year: null };
  const data = await res.json().catch(() => null as any);
  if (!data) return { points: null, year: null };

  // Try common shapes
  const yearKey = String(y);
  let pts: any = null;
  if (data?.rating?.[yearKey]?.organizer_points != null) {
    pts = data.rating[yearKey].organizer_points;
  } else if (data?.[yearKey]?.organizer_points != null) {
    pts = data[yearKey].organizer_points;
  }
  const num = typeof pts === "number" ? pts : Number(pts);
  return Number.isFinite(num) ? { points: num, year: y } : { points: null, year: null };
}

export async function POST(req: NextRequest) {
  try {
    // Accept both `event_id` (used by the UI) and `hosted_event_id` (older name)
    const {
      team_id,
      top_n = 10,
      include_hosted = false,
      hosted_event_id,
      event_id,
      hosted_points,
      year,
    } = await req.json();

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

    // Optional hosted event injection
    let event_weight: number | null = null;
    let hosted_points_out: number | null = null;
    let used_year: number | null = null;
    const hostedId = hosted_event_id || event_id; // support either name

    if (include_hosted) {
      if (typeof hosted_points === "number" && hosted_points > 0) {
        // Direct organizer points provided (preferred path)
        hosted_points_out = hosted_points;
        events.push({
          place: "host",
          event_name: `Organizer points`,
          rating_points: hosted_points_out,
          is_hosted: true,
          event_link: null,
        });
      } else if (team_id) {
        // Fetch organizer_points directly from CTFtime using team ID
        const fetched = await fetchOrganizerPointsFromCTFtime(String(team_id), typeof year === "number" ? year : undefined);
        if (fetched.points && fetched.points > 0) {
          hosted_points_out = fetched.points;
          used_year = fetched.year;
          events.push({
            place: "host",
            event_name: `Organizer points${used_year ? ` (${used_year})` : ""}`,
            rating_points: hosted_points_out,
            is_hosted: true,
            event_link: null,
          });
        } else if (hostedId) {
          // Back-compat: allow computing via event weight approximation
          event_weight = await fetchEventWeight(String(hostedId));
          if (event_weight && event_weight > 0) {
            hosted_points_out = event_weight * 2;
            events.push({
              place: "host",
              event_name: `Hosted event ${hostedId}`,
              rating_points: hosted_points_out,
              is_hosted: true,
              event_link: `https://ctftime.org/event/${hostedId}/`,
            });
          }
        }
      } else if (hostedId) {
        // Back-compat: allow computing via event weight approximation
        event_weight = await fetchEventWeight(String(hostedId));
        if (event_weight && event_weight > 0) {
          hosted_points_out = event_weight * 2;
          events.push({
            place: "host",
            event_name: `Hosted event ${hostedId}`,
            rating_points: hosted_points_out,
            is_hosted: true,
            event_link: `https://ctftime.org/event/${hostedId}/`,
          });
        }
      }
    }

    // Ensure sorting accounts for any injected hosted event
    events.sort((a, b) => b.rating_points - a.rating_points);

    const n = Number(top_n) || 10;
    const top = events.slice(0, n);
    const total = top.reduce((s, e) => s + (e.rating_points || 0), 0);

  return NextResponse.json({ events, top, total, event_weight, hosted_points: hosted_points_out, year: used_year });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}
