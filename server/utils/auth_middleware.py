"""JWT authentication and resource-ownership middleware.

The access token is issued at login (see controllers/auth_controller.py) as an
httpOnly cookie named 'accessToken', signed with JWT_SECRET using HS256 and
carrying a 'user_id' claim. These helpers verify that token and expose the
authenticated user on the Flask `request` object as `request.user_id` and
`request.user`.
"""
from functools import wraps
from flask import request, jsonify
import jwt
import os
from bson import ObjectId
from bson.errors import InvalidId

from models.user import User

JWT_SECRET = os.getenv('JWT_SECRET', 'secretkey')


def verify_token(token):
    """Decode and validate a JWT string, returning its user_id or None.

    Context-free (no Flask request needed) so it can be reused by Socket.IO
    event handlers as well as HTTP middleware.
    """
    if not token:
        return None
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
    except jwt.InvalidTokenError:
        return None
    return payload.get('user_id')


def user_is_order_party(user_id, order):
    """True if user_id is the restaurant or NGO referenced by the order."""
    if user_id is None or order is None:
        return False
    return (
        str(getattr(order.restaurant_id, 'id', order.restaurant_id)) == str(user_id)
        or str(getattr(order.ngo_id, 'id', order.ngo_id)) == str(user_id)
    )


def _extract_token():
    """Pull the JWT from the accessToken cookie, falling back to a Bearer header."""
    token = request.cookies.get('accessToken')
    if not token:
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header[len('Bearer '):].strip()
    return token or None


def require_auth(f):
    """Verify the request's JWT and attach request.user_id / request.user.

    Returns 401 for a missing, malformed, expired, or otherwise invalid token,
    or when the token references a user that no longer exists.
    """
    @wraps(f)
    def wrapper(*args, **kwargs):
        token = _extract_token()
        if not token:
            return jsonify({"message": "Authentication required"}), 401

        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return jsonify({"message": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"message": "Invalid authentication token"}), 401

        user_id = payload.get('user_id')
        if not user_id:
            return jsonify({"message": "Invalid token payload"}), 401

        try:
            user = User.objects(id=ObjectId(user_id)).first()
        except (InvalidId, TypeError):
            return jsonify({"message": "Invalid token payload"}), 401

        if not user:
            return jsonify({"message": "User no longer exists"}), 401

        # Expose the authenticated identity to the wrapped view / controller.
        request.user_id = str(user.id)
        request.user = user
        return f(*args, **kwargs)

    return wrapper


def require_role(*roles):
    """Require an authenticated user whose user_type is one of `roles`.

    Must be applied *below* @require_auth (i.e. closer to the function) so that
    request.user is already populated.
    """
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            user = getattr(request, 'user', None)
            if user is None or user.user_type not in roles:
                return jsonify({"message": "Forbidden: insufficient permissions"}), 403
            return f(*args, **kwargs)
        return wrapper
    return decorator


# ---- Ownership helpers (used inside controllers) ----

def current_user_id():
    """The authenticated user's id as a string (set by require_auth)."""
    return getattr(request, 'user_id', None)


def owns(resource_owner_id):
    """True if the authenticated user owns a resource with the given owner id.

    Accepts a raw id, an ObjectId, or a ReferenceField/Document exposing `.id`.
    """
    uid = current_user_id()
    if uid is None or resource_owner_id is None:
        return False
    owner = getattr(resource_owner_id, 'id', resource_owner_id)
    return str(owner) == str(uid)


def is_order_party(order):
    """True if the authenticated user is the restaurant or NGO on this order."""
    return owns(order.restaurant_id) or owns(order.ngo_id)
