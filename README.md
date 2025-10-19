CTFtime Points Calculator (Web)
================================

This adds a tiny Flask web app to calculate CTFtime event rating and fetch a team's total points (top N) directly from your browser.

Quick start (Windows/PowerShell)
--------------------------------

1) Create/activate a Python env (optional but recommended).

2) Install dependencies using your chosen tool. If you have `uv`:

```
uv sync
```

Alternatively with pip:

```
pip install -r requirements.txt
```

Or directly from pyproject with pip (requires pip>=23.1):

```
pip install .
```

3) Run the app:

```
python -m flask --app app run --debug
```

Then open http://127.0.0.1:5000 in your browser.

Notes
-----
- The Team page scrapes CTFtime public pages; avoid heavy use. If the markup changes, parsing may need updates.
- Hosted events on CTFtime are denoted with an asterisk; you can exclude them from totals.
- The single-event calculator uses the same formula as your original script.

