"""
Coach Branding API Routes
Handles logo upload, profile photo upload, and branding settings management
"""

from flask import Blueprint, request, jsonify, current_app
from src.routes.auth import token_required
from src.models.user import db, User, CoachProfile
from functools import wraps
import cloudinary
import cloudinary.uploader
import os

branding_bp = Blueprint('branding', __name__)

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME', 'dqeeyulrl'),
    api_key=os.getenv('CLOUDINARY_API_KEY', '452768588564189'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET', '3va0N8kmYAtAKCAhLo7OMWwA-Yw')
)

# Coach-only decorator
def coach_required(f):
    @wraps(f)
    def coach_decorated(current_user, *args, **kwargs):
        if current_user.role != 'coach':
            return jsonify({'message': 'Coach access required'}), 403
        return f(current_user, *args, **kwargs)
    return coach_decorated

@branding_bp.route('/branding', methods=['GET'])
@token_required
@coach_required
def get_branding(current_user):
    """Get current coach's branding settings"""
    try:
        coach_profile = CoachProfile.query.filter_by(user_id=current_user.id).first()
        if not coach_profile:
            return jsonify({"message": "Coach profile not found"}), 404
        
        branding = {
            'logo_url': coach_profile.logo_url,
            'profile_photo_url': coach_profile.profile_photo_url,
            'business_name': coach_profile.business_name,
            'motto': coach_profile.motto,
            'description': coach_profile.description,
            'brand_color_primary': coach_profile.brand_color_primary or '#8B5CF6'
        }
        
        return jsonify(branding), 200
        
    except Exception as e:
        return jsonify({"message": f"Error fetching branding: {str(e)}"}), 500


@branding_bp.route('/branding', methods=['PUT'])
@token_required
@coach_required
def update_branding(current_user):
    """Update coach's branding settings (text fields only)"""
    try:
        coach_profile = CoachProfile.query.filter_by(user_id=current_user.id).first()
        if not coach_profile:
            return jsonify({"message": "Coach profile not found"}), 404
        
        data = request.get_json()
        
        if 'business_name' in data:
            coach_profile.business_name = data['business_name']
        if 'motto' in data:
            coach_profile.motto = data['motto']
        if 'description' in data:
            coach_profile.description = data['description']
        if 'brand_color_primary' in data:
            color = data['brand_color_primary']
            if color and (not color.startswith('#') or len(color) != 7):
                return jsonify({"message": "Invalid color format. Use hex code like #8B5CF6"}), 400
            coach_profile.brand_color_primary = color
        
        db.session.commit()
        
        return jsonify({
            "message": "Branding updated successfully",
            "branding": {
                'logo_url': coach_profile.logo_url,
                'profile_photo_url': coach_profile.profile_photo_url,
                'business_name': coach_profile.business_name,
                'motto': coach_profile.motto,
                'description': coach_profile.description,
                'brand_color_primary': coach_profile.brand_color_primary
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error updating branding: {str(e)}"}), 500


@branding_bp.route('/branding/upload-logo', methods=['POST'])
@token_required
@coach_required
def upload_logo(current_user):
    """Upload coach's logo to Cloudinary"""
    try:
        coach_profile = CoachProfile.query.filter_by(user_id=current_user.id).first()
        if not coach_profile:
            return jsonify({"message": "Coach profile not found"}), 404
        
        if 'file' not in request.files:
            return jsonify({"message": "No file provided"}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({"message": "No file selected"}), 400
        
        allowed_extensions = {'png', 'jpg', 'jpeg', 'svg', 'webp'}
        file_ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
        
        if file_ext not in allowed_extensions:
            return jsonify({"message": f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"}), 400
        
        upload_result = cloudinary.uploader.upload(
            file,
            folder=f"athletehub/coach-branding/{current_user.id}",
            public_id=f"logo_{current_user.id}",
            overwrite=True,
            resource_type="image",
            transformation=[
                {'width': 500, 'height': 500, 'crop': 'limit'},
                {'quality': 'auto:good'}
            ]
        )
        
        coach_profile.logo_url = upload_result['secure_url']
        db.session.commit()
        
        return jsonify({
            "message": "Logo uploaded successfully",
            "logo_url": upload_result['secure_url']
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error uploading logo: {str(e)}"}), 500


@branding_bp.route('/branding/upload-photo', methods=['POST'])
@token_required
@coach_required
def upload_photo(current_user):
    """Upload coach's profile photo to Cloudinary"""
    try:
        coach_profile = CoachProfile.query.filter_by(user_id=current_user.id).first()
        if not coach_profile:
            return jsonify({"message": "Coach profile not found"}), 404
        
        if 'file' not in request.files:
            return jsonify({"message": "No file provided"}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({"message": "No file selected"}), 400
        
        allowed_extensions = {'png', 'jpg', 'jpeg', 'webp'}
        file_ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
        
        if file_ext not in allowed_extensions:
            return jsonify({"message": f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"}), 400
        
        upload_result = cloudinary.uploader.upload(
            file,
            folder=f"athletehub/coach-branding/{current_user.id}",
            public_id=f"photo_{current_user.id}",
            overwrite=True,
            resource_type="image",
            transformation=[
                {'width': 400, 'height': 400, 'crop': 'fill', 'gravity': 'face'},
                {'quality': 'auto:good'},
                {'radius': 'max'}
            ]
        )
        
        coach_profile.profile_photo_url = upload_result['secure_url']
        db.session.commit()
        
        return jsonify({
            "message": "Profile photo uploaded successfully",
            "profile_photo_url": upload_result['secure_url']
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error uploading photo: {str(e)}"}), 500


@branding_bp.route('/branding/delete-logo', methods=['DELETE'])
@token_required
@coach_required
def delete_logo(current_user):
    """Delete coach's logo"""
    try:
        coach_profile = CoachProfile.query.filter_by(user_id=current_user.id).first()
        if not coach_profile:
            return jsonify({"message": "Coach profile not found"}), 404
        
        coach_profile.logo_url = None
        db.session.commit()
        
        return jsonify({"message": "Logo deleted successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error deleting logo: {str(e)}"}), 500


@branding_bp.route('/branding/delete-photo', methods=['DELETE'])
@token_required
@coach_required
def delete_photo(current_user):
    """Delete coach's profile photo"""
    try:
        coach_profile = CoachProfile.query.filter_by(user_id=current_user.id).first()
        if not coach_profile:
            return jsonify({"message": "Coach profile not found"}), 404
        
        coach_profile.profile_photo_url = None
        db.session.commit()
        
        return jsonify({"message": "Profile photo deleted successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error deleting photo: {str(e)}"}), 500
