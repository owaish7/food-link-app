from flask import Blueprint, request, jsonify
from controllers.listing_controller import (
    get_restaurant_listings,
    create_listing,
    update_listing,
    delete_listing,
    get_nearby_listings
)
from utils.auth_middleware import require_auth, require_role

listing_bp = Blueprint('listing_bp', __name__)

@listing_bp.route('/listings/<restaurant_id>', methods=['GET'])
@require_auth
def restaurant_listings(restaurant_id):
    """Get all listings for a specific restaurant."""
    return get_restaurant_listings(restaurant_id)

@listing_bp.route('/listings', methods=['POST'])
@require_auth
@require_role('Restaurant')
def create_new_listing():
    """Create a new listing."""
    return create_listing()

@listing_bp.route('/listings/<id>', methods=['PUT'])
@require_auth
def update_existing_listing(id):
    """Update an existing listing."""
    return update_listing(id)

@listing_bp.route('/listings/<id>', methods=['DELETE'])
@require_auth
def delete_existing_listing(id):
    """Delete a listing."""
    return delete_listing(id)

@listing_bp.route('/nearbyRestaurants', methods=['GET'])
@require_auth
def nearby_restaurants():
    """Get nearby listings based on given coordinates."""
    return get_nearby_listings()
