"use client";
import React, { useEffect, useState } from "react";

function getYear() {
  return String(new Date().getFullYear());
}

export default function TeamPage() {
  const [teamId, setTeamId] = useState("");
  const [topN, setTopN] = useState("10");
  const [includeHosted, setIncludeHosted] = useState(false);
  const [hostedPoints, setHostedPoints] = useState<number | null>(null); // organizer points
  const [error, setError] = useState<string | null>(null);
  const [top, setTop] = useState<any[]>([]);
  const [total, setTotal] = useState<number | null>(null);

  async function fetchOrganizerPoints(id: string) {
    if (!id) return null;
    const res = await fetch(`/api/team?team_id=${encodeURIComponent(id)}`, { cache: "no-store" });
    if (!res.ok) return null;
    const j = await res.json();
    const team = j?.team ?? j; // be resilient
    const y = getYear();
    // Try common shapes: team.rating[year].organizer_points OR team[year].organizer_points
    const op =
      team?.rating?.[y]?.organizer_points ??
      team?.[y]?.organizer_points ??
      null;
    return typeof op === "number" ? op : null;
  }

  function onToggleInclude() {
    const next = !includeHosted;
    setIncludeHosted(next);
  }

  useEffect(() => {
    // Auto-fetch organizer points when toggled on and teamId is present
    (async () => {
      if (includeHosted && teamId) {
        const op = await fetchOrganizerPoints(teamId);
        setHostedPoints(op);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeHosted, teamId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setTop([]);
    setTotal(null);
    try {
      // If including hosted points, refresh them just before submit for safety
      let organizerPts: number | null = hostedPoints;
      if (includeHosted) {
        organizerPts = await fetchOrganizerPoints(teamId);
        setHostedPoints(organizerPts);
      }
      const r = await fetch("/api/team-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_id: teamId,
          top_n: topN,
          include_hosted: includeHosted,
          hosted_points: organizerPts ?? undefined,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
      setTop(j.top || []);
      setTotal(typeof j.total === "number" ? j.total : null);
      if (typeof j.hosted_points === "number") setHostedPoints(j.hosted_points);
    } catch (err: any) {
      setError(err.message || "Failed to fetch team data");
    }
  }

  return (
    <main>
      <h2>Team Total Points</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={onSubmit}>
        <label>
          CTFtime Team ID
          <input type="text" value={teamId} onChange={(e) => setTeamId(e.target.value)} placeholder="e.g., 123456" required />
        </label>
        <label>
          Top N events (Make sure to choose 10 to calculate your total points)
          <input type="number" value={topN} min={1} max={20} onChange={(e) => setTopN(e.target.value)} />
        </label>
        <div style={{ margin: ".5rem 0" }}>
          <label>
            <input type="checkbox" id="include_hosted" checked={includeHosted} onChange={onToggleInclude} />
            Include organizer points (taken from CTFtime team API for the current year)
          </label>
          {includeHosted && (
            <span title="Organizer points from CTFtime team API">
              Organizer points: {hostedPoints != null ? hostedPoints.toFixed(3) : "—"}
            </span>
          )}
        </div>
        <button type="submit">Fetch</button>
      </form>

      {top.length > 0 && (
        <>
          <h3>Results</h3>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Place</th>
                <th>Event</th>
                <th>Rating</th>
                <th>Hosted</th>
              </tr>
            </thead>
            <tbody>
              {top.map((e, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>{e.place}</td>
                  <td>
                    {e.event_link ? (
                      <a href={e.event_link} target="_blank" rel="noreferrer">{e.event_name}</a>
                    ) : (
                      e.event_name
                    )}
                  </td>
                  <td>{Number(e.rating_points).toFixed(3)}</td>
                  <td>{e.is_hosted ? "*" : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {total !== null && (
            <p>
              <strong>
                Total (top {top.length}): {total.toFixed(3)}
              </strong>
            </p>
          )}
        </>
      )}
    </main>
  );
}
