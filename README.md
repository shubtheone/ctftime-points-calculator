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

Deploy to Vercel via GitHub
---------------------------

This repo includes a working Vercel setup so you can import directly from GitHub (no CLI needed).

Included files:
- `vercel.json`: sets the Python runtime and routes all requests to our serverless handler
- `api/index.py`: wraps the Flask app using `vercel-wsgi`
- `requirements.txt`: contains Flask, requests, beautifulsoup4, and vercel-wsgi

Steps:
1) Push your repo to GitHub (which you’ve already done).
2) Open Vercel “Import Project from GitHub”.
3) Framework Preset: Other.
4) Root Directory: repository root (where `vercel.json` lives).
5) Leave Build/Output Settings off (serverless Python doesn’t need them).
6) Click Deploy.

Custom Domain (ctfpoints-calculator.me):
- In Vercel → Project → Settings → Domains → Add your domain.
- In your DNS provider (Namespace):
	- A record for @ → 76.76.21.21
	- CNAME record for www → cname.vercel-dns.com
- Wait for DNS to propagate; Vercel will provision HTTPS automatically.

