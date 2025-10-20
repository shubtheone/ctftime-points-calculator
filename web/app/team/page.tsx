"use client";
import React, { useEffect, useState } from "react";

function toggleIncludeHosted(include: boolean) {
  if (typeof document === "undefined") return;
  const eventInput = document.getElementById("event_id") as HTMLInputElement | null;
  if (eventInput) eventInput.disabled = !include;
}

export default function TeamPage() {
  const [teamId, setTeamId] = useState("");
  const [topN, setTopN] = useState("10");
  const [includeHosted, setIncludeHosted] = useState(false);
  const [eventId, setEventId] = useState("");
  const [eventWeight, setEventWeight] = useState<number | null>(null);
  const [hostedPoints, setHostedPoints] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [top, setTop] = useState<any[]>([]);
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    toggleIncludeHosted(includeHosted);
  }, [includeHosted]);

  function onToggleInclude() {
    const next = !includeHosted;
    setIncludeHosted(next);
  }

  async function fetchWeight(id: string) {
    if (!id) return;
    const r = await fetch(`/api/event?id=${encodeURIComponent(id)}`);
    const j = await r.json();
    if (typeof j.weight === "number") {
      setEventWeight(j.weight);
      setHostedPoints(j.weight * 2);
    } else {
      setEventWeight(null);
      setHostedPoints(null);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setTop([]);
    setTotal(null);
    try {
      const r = await fetch("/api/team-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_id: teamId,
          top_n: topN,
          include_hosted: includeHosted,
          event_id: eventId,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
      setTop(j.top || []);
      setTotal(typeof j.total === "number" ? j.total : null);
      if (typeof j.event_weight === "number") setEventWeight(j.event_weight);
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
            Include your hosted events (requires event number eg. https://ctftime.org/event/2848)
          </label>
          <input
            type="text"
            id="event_id"
            placeholder="enter event number (e.g., 2848)"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            onFocus={() => setIncludeHosted(true)}
            onClick={() => setIncludeHosted(true)}
            disabled={!includeHosted}
          />
          {eventWeight !== null && (
            <span title="Rating weight fetched from event page">
              Weight: {eventWeight.toFixed(2)} & Points Gain = {(eventWeight * 2).toFixed(2)}
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
