"use client";
import React, { useState } from "react";

export default function EventPage() {
  const [form, setForm] = useState({
    weight: "",
    total_teams: "",
    best_points: "",
    team_place: "",
    team_points: "",
  });
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetchingWeightFor, setFetchingWeightFor] = useState<string>("");

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    try {
      const r = await fetch("/api/calc-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weight: form.weight,
          total_teams: form.total_teams,
          best_points: form.best_points,
          team_place: form.team_place,
          team_points: form.team_points,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
      setResult(j.result);
    } catch (err: any) {
      setError(err.message || "Please provide valid numeric inputs.");
    }
  }

  async function fetchWeightFromEvent(id: string) {
    if (!id) return;
    setFetchingWeightFor(id);
    try {
      const r = await fetch(`/api/event?id=${encodeURIComponent(id)}`);
      const j = await r.json();
      if (j && typeof j.weight === "number") {
        setForm({ ...form, weight: String(j.weight) });
      }
    } finally {
      setFetchingWeightFor("");
    }
  }

  return (
    <main>
      <h2>Event Rating</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={onSubmit}>
        <label>
          Event weight
          <input type="number" name="weight" step="0.01" value={form.weight} onChange={onChange} required />
        </label>
        <label>
          Total teams
          <input type="number" name="total_teams" step="1" value={form.total_teams} onChange={onChange} required />
        </label>
        <label>
          Best team points (#1)
          <input type="number" name="best_points" step="0.01" value={form.best_points} onChange={onChange} required />
        </label>
        <label>
          Your team place
          <input type="number" name="team_place" step="1" value={form.team_place} onChange={onChange} required />
        </label>
        <label>
          Your team points
          <input type="number" name="team_points" step="0.01" value={form.team_points} onChange={onChange} required />
        </label>
        <button type="submit">Calculate</button>
      </form>

      {result !== null && (
        <>
          <h3>Calculated Rating</h3>
          <p>
            <strong>{result.toFixed(3)}</strong>
          </p>
        </>
      )}

      <hr />
      <details>
        <summary>Don’t know weight? Fetch from CTFtime event ID</summary>
        <input
          placeholder="Event ID e.g., 2848"
          onBlur={(e) => fetchWeightFromEvent(e.currentTarget.value)}
        />
        {fetchingWeightFor && <small>Fetching weight for {fetchingWeightFor}…</small>}
      </details>
    </main>
  );
}
