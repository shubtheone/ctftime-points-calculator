# This is a script to calculate CTF score for a specific CTF Event
def calculate_rating(weight, total_teams, best_points, team_place, team_points):

    points_coef = team_points / best_points if best_points > 0 else 0

    place_coef = 1 / team_place if team_place > 0 else 0

    if points_coef > 0:
        e_rating = ((points_coef + place_coef) * weight) / (1 / (1 + team_place/total_teams))
        return e_rating
    return 0

weigh=float(input("What's the weight of the event which is mentioned in CTFTime? "))
tteams=int(input("What's the total number of teams playing in the event? "))
bpoints=float(input("What's the max score achieved by a team / #1 team score? "))
team_plac=int(input("What's your team ranking? "))
team_point=float(input("Points scored by your team? "))


rating = calculate_rating(weigh, tteams, bpoints, team_plac, team_point)
print(f"Calculated Rating: {rating}")

# This is a script to calculate your CTF team total points
import requests
from bs4 import BeautifulSoup
import sys
if len(sys.argv) == 2:
    teamnumber = sys.argv[1]
else:
    print("Please provide a team number")
    print("Program usage - python3 <teamnumber> -- example: https://ctftime.org/team/123456")
    exit(1)
url = f'https://ctftime.org/team/{teamnumber}'
response = requests.get(url)
soup = BeautifulSoup(response.text, 'html.parser')

table = soup.find('table', class_='table-striped')

data = []
for row in table.find_all('tr')[1:]:
    cols = row.find_all('td')
    if len(cols) == 5:
        place = cols[1].text.strip()
        event_name = cols[2].text.strip()
        event_link = cols[2].find('a')['href'] if cols[2].find('a') else None
        ctf_points = float(cols[3].text.strip())
        rating_points = float(cols[4].text.strip().replace("*", ""))

        data.append({
            'place': place,
            'event_name': event_name,
            'rating_points': rating_points
        })
data.sort(key=lambda x: x['rating_points'], reverse=True)
for entry in data[:10]:
    print(f"{entry['place']:>3} | {entry['event_name']:<30} | Rating: {entry['rating_points']} |")
total = 0
for entry in data[:10]:

    total += float(entry["rating_points"])
print()
print(f"Teams total rating (excluding hosted events):  {total:.3f}")