from __future__ import annotations

import os
from flask import Flask, render_template, request

from calculator import (
    calculate_event_rating,
    fetch_team_events,
    summarize_team_points,
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
        # For checkboxes, when unchecked the field is absent from form data.
        # Default to True on first load (GET), and reflect user's choice on POST.
        if request.method == "POST":
            exclude_hosted = "exclude_hosted" in request.form
        else:
            exclude_hosted = True
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
                    top, total = summarize_team_points(events, top_n=top_n, exclude_hosted=exclude_hosted)
                except Exception as e:
                    error = f"Failed to fetch team data: {e}"

        return render_template(
            "team.html",
            team_id=team_id,
            top_n=top_n_raw,
            exclude_hosted=exclude_hosted,
            events=events,
            top=top,
            total=total,
            error=error,
        )

    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=True)
