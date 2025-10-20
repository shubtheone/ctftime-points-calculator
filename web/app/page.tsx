"use client";
import { useState } from "react";

export default function Home() {
  const [eventId, setEventId] = useState("");
  const [weight, setWeight] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [teamId, setTeamId] = useState("");
  const [teamInfo, setTeamInfo] = useState<any>(null);

  async function fetchWeight() {
    setLoading(true);
    setWeight(null);
    try {
      const r = await fetch(`/api/event?id=${encodeURIComponent(eventId)}`);
      const j = await r.json();
      setWeight(j.weight ?? null);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTeam() {
    setLoading(true);
    setTeamInfo(null);
    try {
      const r = await fetch(`/api/team?team_id=${encodeURIComponent(teamId)}`);
      const j = await r.json();
      setTeamInfo(j.team ?? null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: "2rem auto", padding: "1rem" }}>
      <h1>CTFtime Points Calculator (MERN/Next)</h1>

      <section style={{ marginTop: 24 }}>
        <h2>Event Weight</h2>
        <input
          placeholder="Event ID e.g. 2848"
          value={eventId}
          onChange={e => setEventId(e.target.value)}
        />
        <button onClick={fetchWeight} disabled={!eventId || loading}>
          {loading ? "Fetching..." : "Fetch"}
        </button>
        {weight !== null && (
          <p>
            Weight: {weight.toFixed(2)} | Points Gain: {(weight * 2).toFixed(2)}
          </p>
        )}
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Team Info</h2>
        <input
          placeholder="Team ID e.g. 123456"
          value={teamId}
          onChange={e => setTeamId(e.target.value)}
        />
        <button onClick={fetchTeam} disabled={!teamId || loading}>
          {loading ? "Fetching..." : "Fetch"}
        </button>
        {teamInfo && (
          <pre style={{ whiteSpace: "pre-wrap", background: "#111", color: "#eee", padding: 12 }}>
            {JSON.stringify(teamInfo, null, 2)}
          </pre>
        )}
      </section>
    </main>
  );
}