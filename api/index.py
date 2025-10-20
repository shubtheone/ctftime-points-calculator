import os
from vercel_wsgi import handle
from app import app as flask_app

def handler(event, context):
    # event/context are provided by Vercel; vercel-wsgi adapts them to WSGI
    return handle(flask_app, event, context)