# Shared Socket.IO instance.
#
# Kept in its own module so that HTTP controllers (e.g. order_controller) can
# import `socketio` and emit real-time events WITHOUT importing app.py, which
# would create a circular import (app.py imports the controllers via blueprints).
#
# app.py calls socketio.init_app(app, ...) at startup. Because the deployment
# runs a single eventlet worker, in-process emit() from a request handler reaches
# all connected clients directly — no external message queue (Redis) required.
from flask_socketio import SocketIO

socketio = SocketIO()
