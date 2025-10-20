from __future__ import annotations

import os
from flask import Flask, render_template, request

from calculator import (
    calculate_event_rating,
    fetch_team_events,
    summarize_team_points,
    fetch_event_weight,
    TeamEvent,
)


def create_app() -> Flask:
    app = Flask(__name__)

    @app.get("/")
    def index():
        return render_template("index.html")

    @app.route("/event", methods=["GET", "POST"])
    def event():
        result = None
        error = None
        form = {
            "weight": request.form.get("weight", ""),
            "total_teams": request.form.get("total_teams", ""),
            "best_points": request.form.get("best_points", ""),
            "team_place": request.form.get("team_place", ""),
            "team_points": request.form.get("team_points", ""),
        }
        if request.method == "POST":
            try:
                weight = float(form["weight"]) if form["weight"] != "" else 0.0
                total_teams = int(form["total_teams"]) if form["total_teams"] != "" else 0
                best_points = float(form["best_points"]) if form["best_points"] != "" else 0.0
                team_place = int(form["team_place"]) if form["team_place"] != "" else 0
                team_points = float(form["team_points"]) if form["team_points"] != "" else 0.0
                result = calculate_event_rating(
                    weight, total_teams, best_points, team_place, team_points
                )
            except ValueError:
                error = "Please provide valid numeric inputs."

        return render_template("event.html", form=form, result=result, error=error)

    @app.route("/team", methods=["GET", "POST"])
    def team():
        error = None
        team_id = request.form.get("team_id", "")
        top_n_raw = request.form.get("top_n", "10")
        # Single UI toggle: include_hosted (unchecked by default)
        if request.method == "POST":
            include_hosted = "include_hosted" in request.form
        else:
            include_hosted = False
        exclude_hosted = not include_hosted
        event_id = request.form.get("event_id", "")
        event_weight = None
        hosted_points = None
        events = []
        top = []
        total = None

        if request.method == "POST":
            try:
                top_n = int(top_n_raw)
            except ValueError:
                top_n = 10
            if not team_id.strip():
                error = "Please provide a team ID (e.g., 123456)."
            else:
                try:
                    events = fetch_team_events(team_id.strip())

                    # Always compute base top-N excluding hosted events from scraped list
                    base_events = [e for e in events if not e.is_hosted]
                    base_sorted = sorted(base_events, key=lambda e: e.rating_points, reverse=True)
                    base_top = base_sorted[: max(0, top_n)]
                    base_total = sum(e.rating_points for e in base_top)

                    # Optionally bring hosted points into consideration
                    if include_hosted and event_id.strip():
                        try:
                            event_weight = fetch_event_weight(event_id.strip())
                            if event_weight is not None:
                                hosted_points = 2.0 * float(event_weight)
                                hosted_event = TeamEvent(
                                    place="host",
                                    event_name=f"Your hosted event - {event_id.strip()}",
                                    rating_points=hosted_points,
                                    is_hosted=True,
                                    event_link=f"https://ctftime.org/event/{event_id.strip()}",
                                )
                                # Build candidate list and take top-N; this automatically replaces the least if hosted qualifies
                                candidate = base_events + [hosted_event]
                                cand_sorted = sorted(candidate, key=lambda e: e.rating_points, reverse=True)
                                top = cand_sorted[: max(0, top_n)]
                                total = sum(e.rating_points for e in top)
                            else:
                                # No weight found; fall back to base
                                top, total = base_top, base_total
                        except Exception as e:
                            error = (error + "\n" if error else "") + f"Failed to fetch event weight: {e}"
                            top, total = base_top, base_total
                    else:
                        # No hosted inclusion requested
                        top, total = base_top, base_total
                except Exception as e:
                    error = f"Failed to fetch team data: {e}"

            # Note: event_weight may be populated above; keep as-is for UI

        return render_template(
            "team.html",
            team_id=team_id,
            top_n=top_n_raw,
            exclude_hosted=exclude_hosted,
            include_hosted=include_hosted,
            event_id=event_id,
            event_weight=event_weight,
            hosted_points=hosted_points,
            events=events,
            top=top,
            total=total,
            error=error,
        )

    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
