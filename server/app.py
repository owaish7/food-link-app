from flask import Flask, jsonify, request
from flask_mongoengine import MongoEngine
from flask_socketio import SocketIO, join_room, emit, disconnect
from flask_cors import CORS
from datetime import datetime
import json
from bson import ObjectId
from dotenv import load_dotenv
import os
import osmnx as ox
import networkx as nx

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Configure MongoDB connection
if os.getenv('USE_MOCK_DB') == '1':
    # In-memory database for local development/testing (no MongoDB needed)
    import mongomock
    app.config['MONGODB_SETTINGS'] = {
        'db': 'test',
        'host': 'localhost',
        'mongo_client_class': mongomock.MongoClient,
    }
else:
    app.config['MONGODB_SETTINGS'] = {
        'db': os.getenv('MONGODB_DB_NAME', 'test'),
        'host': os.getenv('MONGO_URI')
    }

# Initialize MongoEngine
db = MongoEngine()
db.init_app(app)

# Allowed frontend origins (comma-separated). Set CLIENT_ORIGIN in production,
# e.g. CLIENT_ORIGIN=https://your-app.vercel.app
client_origins = [o.strip() for o in os.getenv('CLIENT_ORIGIN', 'http://localhost:5173').split(',')]

# Initialize SocketIO
socketio = SocketIO(app, cors_allowed_origins=client_origins)

# Enable CORS
CORS(app, resources={r"/*": {"origins": client_origins}}, supports_credentials=True)

# Custom JSON Encoder
class MongoJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()  # Convert datetime to ISO 8601 format
        elif isinstance(obj, ObjectId):
            return str(obj)  # Convert ObjectId to string
        return super().default(obj)

app.json_encoder = MongoJSONEncoder

# Import blueprints
from routes.order_routes import order_bp
from routes.listing_routes import listing_bp
from routes.auth_routes import auth_bp
from routes.user_routes import user_bp
from routes.recommendation_routes import recommendations_bp
from routes.graph_routes import graph_bp
from routes.content_filtering import content_filter_bp
from routes.sentiment_routes import sentiment_bp
from routes.route_routes import route_bp 
from models.chat import Chat  # Import the Chat model
from models.order import Order
from utils.auth_middleware import verify_token, user_is_order_party

# Register blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(order_bp)
app.register_blueprint(listing_bp)
app.register_blueprint(user_bp)
app.register_blueprint(recommendations_bp)
app.register_blueprint(graph_bp)
app.register_blueprint(content_filter_bp)
app.register_blueprint(sentiment_bp)
app.register_blueprint(route_bp)

# Socket.IO Events
#
# Chat sockets are authenticated with the same JWT used by the REST API. The
# token arrives either via the httpOnly `accessToken` cookie (browser clients
# connecting with withCredentials) or an explicit `auth={'token': ...}` payload.
# We map each connected socket id to its authenticated user so that room joins
# and messages can be restricted to the parties of an order.
sid_to_user = {}


def _authed_user_for_socket(auth):
    """Resolve the JWT for this socket from the auth payload or cookie."""
    token = None
    if isinstance(auth, dict):
        token = auth.get('token')
    if not token:
        token = request.cookies.get('accessToken')
    return verify_token(token)


@socketio.on('connect')
def handle_connect(auth=None):
    user_id = _authed_user_for_socket(auth)
    if not user_id:
        print('Rejected unauthenticated socket connection')
        return False  # refuse the connection
    sid_to_user[request.sid] = user_id
    print(f'User {user_id} connected!')


@socketio.on('join_chat_room')
def handle_join_chat_room(orderId):
    user_id = sid_to_user.get(request.sid)
    try:
        order = Order.objects.get(id=ObjectId(orderId))
    except Exception:
        emit('chat_error', {'message': 'Order not found'})
        return
    if not user_is_order_party(user_id, order):
        emit('chat_error', {'message': 'Forbidden: not a party to this order'})
        return
    join_room(orderId)
    print(f'User {user_id} joined room for order {orderId}')


@socketio.on('send_chat_message')
def handle_send_chat_message(data):
    user_id = sid_to_user.get(request.sid)
    message = data.get('message')
    order_id = data.get('orderId')

    # Verify the sender is authenticated and a party to this order.
    try:
        order = Order.objects.get(id=ObjectId(order_id))
    except Exception:
        emit('chat_error', {'message': 'Order not found'})
        return
    if not user_is_order_party(user_id, order):
        emit('chat_error', {'message': 'Forbidden: not a party to this order'})
        return

    # Sender identity comes from the authenticated token, never the client.
    sender = user_id
    new_message = Chat(message=message, sender=sender, orderId=order_id)
    try:
        new_message.save()
        print('Message saved successfully!')
        emit('receive_chat_message', {'message': message, 'sender': sender}, to=order_id)
    except Exception as e:
        print(f'Error saving message: {str(e)}')


@socketio.on('disconnect')
def handle_disconnect():
    sid_to_user.pop(request.sid, None)
    print('A user disconnected!')

# Run the app with SocketIO
try:
    ox.settings.use_cache = True
    ox.settings.log_console = False
except AttributeError:  # older osmnx
    ox.config(use_cache=True, log_console=False)

if __name__ == '__main__':
    debug_mode = os.getenv('FLASK_DEBUG', '1') == '1'
    socketio.run(app, host='0.0.0.0', port=int(os.getenv('PORT', 8800)), debug=debug_mode)
