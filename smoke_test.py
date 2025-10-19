from __future__ import annotations

from app import create_app


def main() -> int:
    app = create_app()
    client = app.test_client()

    # GET home
    r = client.get("/")
    print("/ status:", r.status_code)
    assert r.status_code == 200

    # GET event page
    r = client.get("/event")
    print("/event status:", r.status_code)
    assert r.status_code == 200

    # POST event calculation
    r = client.post(
        "/event",
        data={
            "weight": "50",
            "total_teams": "100",
            "best_points": "1000",
            "team_place": "10",
            "team_points": "750",
        },
        follow_redirects=True,
    )
    print("/event POST status:", r.status_code)
    assert r.status_code == 200
    assert b"Calculated Rating" in r.data

    print("Smoke tests passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
