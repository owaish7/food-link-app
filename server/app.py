from flask import Flask, jsonify
from flask_mongoengine import MongoEngine
from flask_socketio import SocketIO, join_room, emit
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
@socketio.on('connect')
def handle_connect():
    print('A user connected!')

@socketio.on('join_chat_room')
def handle_join_chat_room(orderId):
    join_room(orderId)
    print(f'User joined room for order {orderId}')

@socketio.on('send_chat_message')
def handle_send_chat_message(data):
    message = data.get('message')
    order_id = data.get('orderId')
    sender = data.get('sender')

    # Save message to MongoDB
    new_message = Chat(message=message, sender=sender, orderId=order_id)
    try:
        new_message.save()
        print('Message saved successfully!')
        emit('receive_chat_message', {'message': message, 'sender': sender}, to=order_id)
    except Exception as e:
        print(f'Error saving message: {str(e)}')

@socketio.on('disconnect')
def handle_disconnect():
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
