import os
from vercel_wsgi import handle
from app import app as flask_app

def handler(environ, start_response):
    os.environ.setdefault("FLASK_ENV", "production")
    return handle(flask_app, environ, start_response)