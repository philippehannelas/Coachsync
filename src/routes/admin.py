from flask import Blueprint, request, jsonify
from src.models.user import User, db
from src.routes.auth import admin_required
from datetime import datetime
from sqlalchemy import or_

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/users', methods=['GET'])
@admin_required
def get_all_users(current_user):
    """
    Admin endpoint to get a list of all users with their profiles.
    """
    try:
        # Get all users and eager load their profiles
        users = User.query.options(
            db.joinedload(User.coach_profile),
            db.joinedload(User.customer_profile)
        ).all()
        
        user_list = []
        for user in users:
            user_data = user.to_dict()
            if user.role == 'coach' and user.coach_profile:
                user_data['profile'] = user.coach_profile.to_dict()
            elif user.role == 'customer' and user.customer_profile:
                user_data['profile'] = user.customer_profile.to_dict()
            user_list.append(user_data)
            
        return jsonify(user_list), 200
    except Exception as e:
        return jsonify({'message': f'Failed to retrieve users: {str(e)}'}), 500

@admin_bp.route('/users/<user_id>/status', methods=['PUT'])
@admin_required
def update_user_status(current_user, user_id):
    """
    Admin endpoint to change the status of any user.
    """
    try:
        data = request.json
        new_status = data.get('status')
        status_reason = data.get('reason', '')

        if not new_status or new_status not in ['active', 'inactive', 'suspended', 'deleted']:
            return jsonify({'message': 'Invalid status provided'}), 400

        user_to_update = User.query.get(user_id)
        if not user_to_update:
            return jsonify({'message': 'User not found'}), 404

        # Prevent admin from changing their own status to deleted or suspended
        if user_to_update.id == current_user.id and new_status in ['deleted', 'suspended']:
            return jsonify({'message': 'Cannot change your own status to deleted or suspended'}), 403

        # Update status fields
        user_to_update.account_status = new_status
        user_to_update.status_changed_at = datetime.utcnow()
        user_to_update.status_changed_by = current_user.id
        user_to_update.status_reason = status_reason
        
        if new_status == 'deleted':
            user_to_update.deleted_at = datetime.utcnow()
        elif user_to_update.deleted_at is not None:
            user_to_update.deleted_at = None # Un-delete if status is changed back

        db.session.commit()

        return jsonify({'message': f'User {user_id} status updated to {new_status}'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to update user status: {str(e)}'}), 500

@admin_bp.route('/users/<user_id>/reset-password', methods=['POST'])
@admin_required
def admin_reset_password(current_user, user_id):
    """
    Admin endpoint to initiate a password reset for any user.
    NOTE: This only sends the reset email. The actual reset is done via a separate public endpoint.
    """
    try:
        user_to_reset = User.query.get(user_id)
        if not user_to_reset:
            return jsonify({'message': 'User not found'}), 404

        # Generate a secure, time-limited token
        reset_token = jwt.encode({
            'user_id': user_to_reset.id,
            'type': 'password_reset',
            'exp': datetime.utcnow() + timedelta(hours=1) # Token expires in 1 hour
        }, current_app.config['SECRET_KEY'], algorithm='HS256')

        # TODO: Implement email sending logic here
        # For now, we'll just return the token and a success message
        
        # In a real app, you would send an email with a link like:
        # f"https://yourdomain.com/reset-password?token={reset_token}"

        return jsonify({
            'message': f'Password reset initiated for user {user_id}.',
            'reset_token': reset_token # For testing purposes only
        }), 200
    except Exception as e:
        return jsonify({'message': f'Failed to initiate password reset: {str(e)}'}), 500
