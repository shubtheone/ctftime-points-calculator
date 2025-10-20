from vercel_wsgi import handle
from app import app as flask_app

def handler(environ, start_response):
    return handle(flask_app, environ, start_response)