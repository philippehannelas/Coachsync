from flask import Blueprint, request, jsonify, current_app
from src.models.user import db, CoachProfile, User
from src.routes.auth import token_required

coach_network_bp = Blueprint('coach_network', __name__)

@coach_network_bp.route('/coach/search', methods=['GET'])
@token_required
def search_coaches(current_user):
    """
    Search for coaches in the system
    Query params:
    - q: search query (name or email)
    - limit: max results (default 20)
    """
    try:
        if current_user.role != 'coach':
            return jsonify({'error': 'Only coaches can search for other coaches'}), 403
        
        search_query = request.args.get('q', '').strip()
        limit = min(int(request.args.get('limit', 20)), 50)
        
        # Build query
        query = db.session.query(CoachProfile, User).join(
            User, CoachProfile.user_id == User.id
        ).filter(
            User.account_status == 'active',
            User.id != current_user.id  # Exclude self
        )
        
        # Apply search filter
        if search_query:
            search_pattern = f'%{search_query}%'
            query = query.filter(
                db.or_(
                    User.first_name.ilike(search_pattern),
                    User.last_name.ilike(search_pattern),
                    User.email.ilike(search_pattern)
                )
            )
        
        # Execute query
        results = query.limit(limit).all()
        
        # Format response
        coaches = []
        for coach_profile, user in results:
            coaches.append({
                'id': coach_profile.id,
                'user_id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'full_name': f'{user.first_name} {user.last_name}',
                'profile_picture': getattr(user, 'profile_picture', None),
                'specialty': getattr(coach_profile, 'specialty', None),
                'bio': getattr(coach_profile, 'bio', None)
            })
        
        return jsonify({
            'coaches': coaches,
            'count': len(coaches)
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Error searching coaches: {str(e)}')
        return jsonify({'error': 'Failed to search coaches'}), 500

@coach_network_bp.route('/coach/list', methods=['GET'])
@token_required
def list_all_coaches(current_user):
    """
    Get list of all active coaches (for dropdown)
    """
    try:
        if current_user.role != 'coach':
            return jsonify({'error': 'Only coaches can access this endpoint'}), 403
        
        # Get all active coaches except current user
        results = db.session.query(CoachProfile, User).join(
            User, CoachProfile.user_id == User.id
        ).filter(
            User.account_status == 'active',
            User.id != current_user.id
        ).order_by(User.first_name, User.last_name).all()
        
        coaches = []
        for coach_profile, user in results:
            coaches.append({
                'id': coach_profile.id,
                'user_id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'full_name': f'{user.first_name} {user.last_name}',
                'profile_picture': getattr(user, 'profile_picture', None)
            })
        
        return jsonify({
            'coaches': coaches,
            'count': len(coaches)
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Error listing coaches: {str(e)}')
        return jsonify({'error': 'Failed to list coaches'}), 500
