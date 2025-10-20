from __future__ import annotations

from dataclasses import dataclass
from typing import List, Tuple

import requests
from bs4 import BeautifulSoup


def calculate_event_rating(
    weight: float,
    total_teams: int,
    best_points: float,
    team_place: int,
    team_points: float,
) -> float:
    """Calculate CTFtime event rating for a single result.

    Inputs:
    - weight: event weight from CTFtime (e.g., 44.00)
    - total_teams: total number of teams in the event
    - best_points: score of the #1 team in the event
    - team_place: your team's final place (1-based)
    - team_points: your team's score

    Returns: rating as float (0 if insufficient data)
    """
    points_coef = (team_points / best_points) if best_points > 0 else 0.0
    place_coef = (1 / team_place) if team_place > 0 else 0.0

    if points_coef > 0:
        # keep the original script's formula
        denom = (1 / (1 + team_place / total_teams)) if total_teams > 0 else 0.0
        if denom == 0:
            return 0.0
        e_rating = ((points_coef + place_coef) * weight) / denom
        return float(e_rating)
    return 0.0


@dataclass
class TeamEvent:
    place: str
    event_name: str
    rating_points: float
    is_hosted: bool
    event_link: str | None = None


def fetch_team_events(team_id: str) -> List[TeamEvent]:
    """Scrape a team's page on CTFtime and return parsed events.

    This relies on the current CTFtime table markup (table.table-striped).
    """
    url = f"https://ctftime.org/team/{team_id}"
    resp = requests.get(url, timeout=30)
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")
    table = soup.find("table", class_="table-striped")
    if not table:
        return []

    events: List[TeamEvent] = []
    rows = table.find_all("tr")[1:]  # skip header
    for row in rows:
        cols = row.find_all("td")
        if len(cols) != 5:
            continue
        place = cols[1].get_text(strip=True)
        event_cell = cols[2]
        event_name = event_cell.get_text(strip=True)
        event_link = event_cell.find("a")["href"] if event_cell.find("a") else None

        rating_raw = cols[4].get_text(strip=True)
        is_hosted = "*" in rating_raw
        # Strip possible asterisk before converting to float
        try:
            rating_points = float(rating_raw.replace("*", ""))
        except ValueError:
            # Unexpected format — skip this row
            continue

        events.append(
            TeamEvent(
                place=place,
                event_name=event_name,
                rating_points=rating_points,
                is_hosted=is_hosted,
                event_link=event_link,
            )
        )

    # Sort by rating desc
    events.sort(key=lambda e: e.rating_points, reverse=True)
    return events


def summarize_team_points(
    events: List[TeamEvent], top_n: int = 10, exclude_hosted: bool = True
) -> Tuple[List[TeamEvent], float]:
    """Return the top-N events (optionally excluding hosted) and the total.

    Returns (top_events, total_points)
    """
    filtered = [e for e in events if (not exclude_hosted or not e.is_hosted)]
    top = filtered[: max(0, top_n)]
    total = sum(e.rating_points for e in top)
    return top, float(total)


def fetch_event_weight(event_id: str) -> float | None:
    """Fetch the rating weight from a CTFtime event page.

    It looks for a paragraph like:
      <p>Rating weight: 23.71 <a href="/faq/#weight"> ...
    and extracts the numeric value.
    """
    url = f"https://ctftime.org/event/{event_id}"
    resp = requests.get(url, timeout=30)
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")
    # Find a <p> that starts with 'Rating weight:' and extract the number
    for p in soup.find_all("p"):
        text = p.get_text(strip=True)
        if text.lower().startswith("rating weight:"):
            # Extract the first float number from the text
            # e.g., 'Rating weight: 23.71' -> 23.71
            try:
                # split on ':' and take the part after, then split by space
                after_colon = text.split(":", 1)[1].strip()
                number_str = "".join(ch for ch in after_colon if (ch.isdigit() or ch == "."))
                if number_str:
                    return float(number_str)
            except Exception:
                continue
    return None
