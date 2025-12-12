from flask import Blueprint, request, jsonify, current_app
from src.models.user import db, CoachProfile, User
from src.models.coach_connection import CoachConnection
from src.routes.auth import token_required
from datetime import datetime
from sqlalchemy import or_, and_

coach_connections_bp = Blueprint('coach_connections', __name__)

@coach_connections_bp.route('/coach/network/connections/request', methods=['POST'])
@token_required
def send_connection_request(current_user):
    """
    Send a connection request to another coach
    Body: { receiver_coach_id, message }
    """
    try:
        if current_user.role != 'coach':
            return jsonify({'error': 'Only coaches can send connection requests'}), 403
        
        data = request.get_json()
        receiver_coach_id = data.get('receiver_coach_id')
        message = data.get('message', '')
        
        if not receiver_coach_id:
            return jsonify({'error': 'receiver_coach_id is required'}), 400
        
        # Get requester's coach profile
        requester_profile = CoachProfile.query.filter_by(user_id=current_user.id).first()
        if not requester_profile:
            return jsonify({'error': 'Coach profile not found'}), 404
        
        # Validate receiver exists
        receiver_profile = CoachProfile.query.get(receiver_coach_id)
        if not receiver_profile:
            return jsonify({'error': 'Receiver coach not found'}), 404
        
        # Can't connect with yourself
        if requester_profile.id == receiver_coach_id:
            return jsonify({'error': 'Cannot connect with yourself'}), 400
        
        # Check if connection already exists (in either direction)
        existing = CoachConnection.query.filter(
            or_(
                and_(
                    CoachConnection.requester_coach_id == requester_profile.id,
                    CoachConnection.receiver_coach_id == receiver_coach_id
                ),
                and_(
                    CoachConnection.requester_coach_id == receiver_coach_id,
                    CoachConnection.receiver_coach_id == requester_profile.id
                )
            )
        ).first()
        
        if existing:
            if existing.status == 'blocked':
                return jsonify({'error': 'Connection is blocked'}), 403
            elif existing.status == 'pending':
                return jsonify({'error': 'Connection request already pending'}), 400
            elif existing.status == 'accepted':
                return jsonify({'error': 'Already connected'}), 400
            elif existing.status == 'declined':
                # Allow re-requesting after decline
                existing.status = 'pending'
                existing.requested_at = datetime.utcnow()
                existing.request_message = message
                existing.responded_at = None
                existing.decline_reason = None
                db.session.commit()
                return jsonify({
                    'message': 'Connection request re-sent',
                    'connection': existing.to_dict('requester')
                }), 200
        
        # Create new connection request
        connection = CoachConnection(
            requester_coach_id=requester_profile.id,
            receiver_coach_id=receiver_coach_id,
            status='pending',
            request_message=message
        )
        
        db.session.add(connection)
        db.session.commit()
        
        return jsonify({
            'message': 'Connection request sent',
            'connection': connection.to_dict('requester')
        }), 201
        
    except Exception as e:
        current_app.logger.error(f'Error sending connection request: {str(e)}')
        db.session.rollback()
        return jsonify({'error': 'Failed to send connection request'}), 500


@coach_connections_bp.route('/coach/network/connections', methods=['GET'])
@token_required
def get_connections(current_user):
    """
    Get all connections for current coach
    Query params: status (optional), limit, offset
    """
    try:
        if current_user.role != 'coach':
            return jsonify({'error': 'Only coaches can access connections'}), 403
        
        # Get coach profile
        coach_profile = CoachProfile.query.filter_by(user_id=current_user.id).first()
        if not coach_profile:
            return jsonify({'error': 'Coach profile not found'}), 404
        
        status_filter = request.args.get('status')
        limit = min(int(request.args.get('limit', 50)), 100)
        offset = int(request.args.get('offset', 0))
        
        # Query connections where user is either requester or receiver
        query = CoachConnection.query.filter(
            or_(
                CoachConnection.requester_coach_id == coach_profile.id,
                CoachConnection.receiver_coach_id == coach_profile.id
            )
        )
        
        if status_filter:
            query = query.filter(CoachConnection.status == status_filter)
        
        total = query.count()
        connections = query.order_by(CoachConnection.requested_at.desc()).limit(limit).offset(offset).all()
        
        # Format response with coach details
        result = []
        for conn in connections:
            # Determine perspective and get other coach's info
            if conn.requester_coach_id == coach_profile.id:
                perspective = 'requester'
                other_coach_id = conn.receiver_coach_id
            else:
                perspective = 'receiver'
                other_coach_id = conn.requester_coach_id
            
            # Get other coach's details
            other_coach = CoachProfile.query.get(other_coach_id)
            other_user = User.query.get(other_coach.user_id) if other_coach else None
            
            conn_dict = conn.to_dict(perspective)
            if other_user:
                conn_dict['coach'] = {
                    'id': other_coach.id,
                    'email': other_user.email,
                    'first_name': other_user.first_name,
                    'last_name': other_user.last_name,
                    'full_name': f'{other_user.first_name} {other_user.last_name}',
                    'profile_picture': getattr(other_user, 'profile_picture', None)
                }
            
            result.append(conn_dict)
        
        return jsonify({
            'connections': result,
            'total': total,
            'limit': limit,
            'offset': offset
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Error getting connections: {str(e)}')
        return jsonify({'error': 'Failed to get connections'}), 500


@coach_connections_bp.route('/coach/network/connections/pending', methods=['GET'])
@token_required
def get_pending_requests(current_user):
    """
    Get pending connection requests received by current coach
    """
    try:
        if current_user.role != 'coach':
            return jsonify({'error': 'Only coaches can access connections'}), 403
        
        coach_profile = CoachProfile.query.filter_by(user_id=current_user.id).first()
        if not coach_profile:
            return jsonify({'error': 'Coach profile not found'}), 404
        
        # Get pending requests where current coach is the receiver
        pending = CoachConnection.query.filter_by(
            receiver_coach_id=coach_profile.id,
            status='pending'
        ).order_by(CoachConnection.requested_at.desc()).all()
        
        result = []
        for conn in pending:
            requester_coach = CoachProfile.query.get(conn.requester_coach_id)
            requester_user = User.query.get(requester_coach.user_id) if requester_coach else None
            
            conn_dict = conn.to_dict('receiver')
            if requester_user:
                conn_dict['coach'] = {
                    'id': requester_coach.id,
                    'email': requester_user.email,
                    'first_name': requester_user.first_name,
                    'last_name': requester_user.last_name,
                    'full_name': f'{requester_user.first_name} {requester_user.last_name}',
                    'profile_picture': getattr(requester_user, 'profile_picture', None)
                }
            
            result.append(conn_dict)
        
        return jsonify({
            'pending_requests': result,
            'count': len(result)
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Error getting pending requests: {str(e)}')
        return jsonify({'error': 'Failed to get pending requests'}), 500


@coach_connections_bp.route('/coach/network/connections/<int:connection_id>/accept', methods=['POST'])
@token_required
def accept_connection(current_user, connection_id):
    """
    Accept a connection request
    """
    try:
        if current_user.role != 'coach':
            return jsonify({'error': 'Only coaches can accept connections'}), 403
        
        coach_profile = CoachProfile.query.filter_by(user_id=current_user.id).first()
        if not coach_profile:
            return jsonify({'error': 'Coach profile not found'}), 404
        
        connection = CoachConnection.query.get(connection_id)
        if not connection:
            return jsonify({'error': 'Connection not found'}), 404
        
        # Only receiver can accept
        if connection.receiver_coach_id != coach_profile.id:
            return jsonify({'error': 'Only the receiver can accept this request'}), 403
        
        if connection.status != 'pending':
            return jsonify({'error': f'Cannot accept connection with status: {connection.status}'}), 400
        
        connection.accept()
        db.session.commit()
        
        return jsonify({
            'message': 'Connection accepted',
            'connection': connection.to_dict('receiver')
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Error accepting connection: {str(e)}')
        db.session.rollback()
        return jsonify({'error': 'Failed to accept connection'}), 500


@coach_connections_bp.route('/coach/network/connections/<int:connection_id>/decline', methods=['POST'])
@token_required
def decline_connection(current_user, connection_id):
    """
    Decline a connection request
    Body: { reason } (optional)
    """
    try:
        if current_user.role != 'coach':
            return jsonify({'error': 'Only coaches can decline connections'}), 403
        
        coach_profile = CoachProfile.query.filter_by(user_id=current_user.id).first()
        if not coach_profile:
            return jsonify({'error': 'Coach profile not found'}), 404
        
        connection = CoachConnection.query.get(connection_id)
        if not connection:
            return jsonify({'error': 'Connection not found'}), 404
        
        # Only receiver can decline
        if connection.receiver_coach_id != coach_profile.id:
            return jsonify({'error': 'Only the receiver can decline this request'}), 403
        
        if connection.status != 'pending':
            return jsonify({'error': f'Cannot decline connection with status: {connection.status}'}), 400
        
        data = request.get_json() or {}
        reason = data.get('reason')
        
        connection.decline(reason)
        db.session.commit()
        
        return jsonify({
            'message': 'Connection declined',
            'connection': connection.to_dict('receiver')
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Error declining connection: {str(e)}')
        db.session.rollback()
        return jsonify({'error': 'Failed to decline connection'}), 500


@coach_connections_bp.route('/coach/network/connections/<int:connection_id>', methods=['DELETE'])
@token_required
def remove_connection(current_user, connection_id):
    """
    Remove a connection (requester can cancel, either party can remove accepted connection)
    """
    try:
        if current_user.role != 'coach':
            return jsonify({'error': 'Only coaches can remove connections'}), 403
        
        coach_profile = CoachProfile.query.filter_by(user_id=current_user.id).first()
        if not coach_profile:
            return jsonify({'error': 'Coach profile not found'}), 404
        
        connection = CoachConnection.query.get(connection_id)
        if not connection:
            return jsonify({'error': 'Connection not found'}), 404
        
        # Check if user is part of this connection
        if connection.requester_coach_id != coach_profile.id and connection.receiver_coach_id != coach_profile.id:
            return jsonify({'error': 'You are not part of this connection'}), 403
        
        db.session.delete(connection)
        db.session.commit()
        
        return jsonify({'message': 'Connection removed'}), 200
        
    except Exception as e:
        current_app.logger.error(f'Error removing connection: {str(e)}')
        db.session.rollback()
        return jsonify({'error': 'Failed to remove connection'}), 500


@coach_connections_bp.route('/coach/network/connections/<int:connection_id>/notes', methods=['PUT'])
@token_required
def update_connection_notes(current_user, connection_id):
    """
    Update private notes and tags for a connection
    Body: { notes, tags }
    """
    try:
        if current_user.role != 'coach':
            return jsonify({'error': 'Only coaches can update notes'}), 403
        
        coach_profile = CoachProfile.query.filter_by(user_id=current_user.id).first()
        if not coach_profile:
            return jsonify({'error': 'Coach profile not found'}), 404
        
        connection = CoachConnection.query.get(connection_id)
        if not connection:
            return jsonify({'error': 'Connection not found'}), 404
        
        # Only requester can update notes (notes are private to requester)
        if connection.requester_coach_id != coach_profile.id:
            return jsonify({'error': 'Only the requester can update notes'}), 403
        
        data = request.get_json()
        
        if 'notes' in data:
            connection.notes = data['notes']
        
        if 'tags' in data:
            # Convert list to comma-separated string
            if isinstance(data['tags'], list):
                connection.tags = ','.join(data['tags'])
            else:
                connection.tags = data['tags']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Notes updated',
            'connection': connection.to_dict('requester')
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Error updating notes: {str(e)}')
        db.session.rollback()
        return jsonify({'error': 'Failed to update notes'}), 500


@coach_connections_bp.route('/coach/network/stats', methods=['GET'])
@token_required
def get_network_stats(current_user):
    """
    Get network statistics for current coach
    """
    try:
        if current_user.role != 'coach':
            return jsonify({'error': 'Only coaches can access stats'}), 403
        
        coach_profile = CoachProfile.query.filter_by(user_id=current_user.id).first()
        if not coach_profile:
            return jsonify({'error': 'Coach profile not found'}), 404
        
        # Count connections by status
        total_connections = CoachConnection.query.filter(
            or_(
                CoachConnection.requester_coach_id == coach_profile.id,
                CoachConnection.receiver_coach_id == coach_profile.id
            ),
            CoachConnection.status == 'accepted'
        ).count()
        
        pending_sent = CoachConnection.query.filter_by(
            requester_coach_id=coach_profile.id,
            status='pending'
        ).count()
        
        pending_received = CoachConnection.query.filter_by(
            receiver_coach_id=coach_profile.id,
            status='pending'
        ).count()
        
        # Import here to avoid circular dependency
        from src.models.user import CoachAssignment
        
        assignments_given = CoachAssignment.query.filter_by(
            primary_coach_id=coach_profile.id
        ).count()
        
        assignments_received = CoachAssignment.query.filter_by(
            substitute_coach_id=coach_profile.id
        ).count()
        
        return jsonify({
            'total_connections': total_connections,
            'pending_sent': pending_sent,
            'pending_received': pending_received,
            'assignments_given': assignments_given,
            'assignments_received': assignments_received
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Error getting network stats: {str(e)}')
        return jsonify({'error': 'Failed to get network stats'}), 500
