from flask import Blueprint, request, jsonify, current_app
from src.models.user import db, CoachAssignment, CoachProfile, CustomerProfile, User
from src.routes.auth import token_required
from datetime import datetime, date
from sqlalchemy import and_, or_

assignment_bp = Blueprint('coach_assignment', __name__)

@assignment_bp.route('/coach/assignments', methods=['POST'])
@token_required
def create_assignment(current_user):
    """Create temporary coach assignment(s)"""
    try:
        if current_user.role != 'coach':
            return jsonify({'error': 'Only coaches can create assignments'}), 403
        
        coach_profile = CoachProfile.query.filter_by(user_id=current_user.id).first()
        if not coach_profile:
            return jsonify({'error': 'Coach profile not found'}), 404
        
        data = request.get_json()
        
        # Validate required fields
        if not data.get('customer_ids') or not isinstance(data['customer_ids'], list):
            return jsonify({'error': 'customer_ids must be a non-empty array'}), 400
        
        if not data.get('substitute_coach_email'):
            return jsonify({'error': 'substitute_coach_email is required'}), 400
        
        if not data.get('start_date'):
            return jsonify({'error': 'start_date is required'}), 400
        
        # Find substitute coach by email
        substitute_user = User.query.filter_by(email=data['substitute_coach_email']).first()
        if not substitute_user:
            return jsonify({'error': 'Substitute coach not found'}), 404
        
        if substitute_user.role != 'coach':
            return jsonify({'error': 'Substitute must be a coach'}), 400
        
        substitute_coach = CoachProfile.query.filter_by(user_id=substitute_user.id).first()
        if not substitute_coach:
            return jsonify({'error': 'Substitute coach profile not found'}), 404
        
        # Cannot assign to self
        if substitute_coach.id == coach_profile.id:
            return jsonify({'error': 'Cannot assign customers to yourself'}), 400
        
        # Parse dates
        try:
            start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
            end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date() if data.get('end_date') else None
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        if end_date and end_date < start_date:
            return jsonify({'error': 'end_date must be after start_date'}), 400
        
        # Get permissions
        permissions = data.get('permissions', {})
        
        # Create assignments for each customer
        created_assignments = []
        for customer_id in data['customer_ids']:
            # Verify customer belongs to this coach
            customer = CustomerProfile.query.filter_by(
                id=customer_id,
                coach_id=coach_profile.id
            ).first()
            
            if not customer:
                return jsonify({'error': f'Customer {customer_id} not found or does not belong to you'}), 404
            
            # Check for overlapping assignments
            overlapping = CoachAssignment.query.filter(
                and_(
                    CoachAssignment.customer_id == customer_id,
                    CoachAssignment.status.in_(['pending', 'active']),
                    or_(
                        and_(
                            CoachAssignment.start_date <= start_date,
                            or_(
                                CoachAssignment.end_date.is_(None),
                                CoachAssignment.end_date >= start_date
                            )
                        ),
                        and_(
                            CoachAssignment.start_date <= (end_date or date.max),
                            or_(
                                CoachAssignment.end_date.is_(None),
                                CoachAssignment.end_date >= (end_date or date.max)
                            )
                        )
                    )
                )
            ).first()
            
            if overlapping:
                return jsonify({'error': f'Customer {customer_id} already has an overlapping assignment'}), 409
            
            # Create assignment
            assignment = CoachAssignment(
                primary_coach_id=coach_profile.id,
                substitute_coach_id=substitute_coach.id,
                customer_id=customer_id,
                start_date=start_date,
                end_date=end_date,
                reason=data.get('reason', ''),
                status='pending',
                can_view_history=permissions.get('can_view_history', True),
                can_book_sessions=permissions.get('can_book_sessions', True),
                can_modify_plans=permissions.get('can_modify_plans', False),
                can_add_notes=permissions.get('can_add_notes', True)
            )
            
            db.session.add(assignment)
            created_assignments.append(assignment)
        
        db.session.commit()
        
        return jsonify({
            'message': f'Successfully created {len(created_assignments)} assignment(s)',
            'assignments': [a.to_dict() for a in created_assignments]
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Error creating assignment: {str(e)}')
        return jsonify({'error': 'Failed to create assignment'}), 500

@assignment_bp.route('/coach/assignments/given', methods=['GET'])
@token_required
def get_assignments_given(current_user):
    """Get assignments created by current coach"""
    try:
        if current_user.role != 'coach':
            return jsonify({'error': 'Only coaches can access this endpoint'}), 403
        
        coach_profile = CoachProfile.query.filter_by(user_id=current_user.id).first()
        if not coach_profile:
            return jsonify({'error': 'Coach profile not found'}), 404
        
        # Get filter parameters
        status = request.args.get('status')
        customer_id = request.args.get('customer_id')
        
        # Build query
        query = CoachAssignment.query.filter_by(primary_coach_id=coach_profile.id)
        
        if status:
            query = query.filter_by(status=status)
        
        if customer_id:
            query = query.filter_by(customer_id=int(customer_id))
        
        assignments = query.order_by(CoachAssignment.created_at.desc()).all()
        
        return jsonify({
            'assignments': [a.to_dict() for a in assignments],
            'count': len(assignments)
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Error fetching assignments: {str(e)}')
        return jsonify({'error': 'Failed to fetch assignments'}), 500

@assignment_bp.route('/coach/assignments/received', methods=['GET'])
@token_required
def get_assignments_received(current_user):
    """Get assignments where current coach is substitute"""
    try:
        if current_user.role != 'coach':
            return jsonify({'error': 'Only coaches can access this endpoint'}), 403
        
        coach_profile = CoachProfile.query.filter_by(user_id=current_user.id).first()
        if not coach_profile:
            return jsonify({'error': 'Coach profile not found'}), 404
        
        # Get filter parameters
        status = request.args.get('status')
        
        # Build query
        query = CoachAssignment.query.filter_by(substitute_coach_id=coach_profile.id)
        
        if status:
            query = query.filter_by(status=status)
        
        assignments = query.order_by(CoachAssignment.created_at.desc()).all()
        
        return jsonify({
            'assignments': [a.to_dict() for a in assignments],
            'count': len(assignments)
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Error fetching assignments: {str(e)}')
        return jsonify({'error': 'Failed to fetch assignments'}), 500

@assignment_bp.route('/coach/assignments/<int:assignment_id>/accept', methods=['POST'])
@token_required
def accept_assignment(current_user, assignment_id):
    """Accept a substitute assignment"""
    try:
        if current_user.role != 'coach':
            return jsonify({'error': 'Only coaches can accept assignments'}), 403
        
        coach_profile = CoachProfile.query.filter_by(user_id=current_user.id).first()
        if not coach_profile:
            return jsonify({'error': 'Coach profile not found'}), 404
        
        assignment = CoachAssignment.query.get(assignment_id)
        if not assignment:
            return jsonify({'error': 'Assignment not found'}), 404
        
        if assignment.substitute_coach_id != coach_profile.id:
            return jsonify({'error': 'You are not the substitute coach for this assignment'}), 403
        
        if assignment.status != 'pending':
            return jsonify({'error': f'Cannot accept assignment with status: {assignment.status}'}), 400
        
        assignment.status = 'active'
        assignment.accepted_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Assignment accepted successfully',
            'assignment': assignment.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Error accepting assignment: {str(e)}')
        return jsonify({'error': 'Failed to accept assignment'}), 500

@assignment_bp.route('/coach/assignments/<int:assignment_id>/decline', methods=['POST'])
@token_required
def decline_assignment(current_user, assignment_id):
    """Decline a substitute assignment"""
    try:
        if current_user.role != 'coach':
            return jsonify({'error': 'Only coaches can decline assignments'}), 403
        
        coach_profile = CoachProfile.query.filter_by(user_id=current_user.id).first()
        if not coach_profile:
            return jsonify({'error': 'Coach profile not found'}), 404
        
        assignment = CoachAssignment.query.get(assignment_id)
        if not assignment:
            return jsonify({'error': 'Assignment not found'}), 404
        
        if assignment.substitute_coach_id != coach_profile.id:
            return jsonify({'error': 'You are not the substitute coach for this assignment'}), 403
        
        if assignment.status != 'pending':
            return jsonify({'error': f'Cannot decline assignment with status: {assignment.status}'}), 400
        
        data = request.get_json() or {}
        
        assignment.status = 'declined'
        assignment.decline_reason = data.get('reason', '')
        
        db.session.commit()
        
        return jsonify({
            'message': 'Assignment declined successfully',
            'assignment': assignment.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Error declining assignment: {str(e)}')
        return jsonify({'error': 'Failed to decline assignment'}), 500

@assignment_bp.route('/coach/assignments/<int:assignment_id>/cancel', methods=['POST'])
@token_required
def cancel_assignment(current_user, assignment_id):
    """Cancel an assignment (by primary coach)"""
    try:
        if current_user.role != 'coach':
            return jsonify({'error': 'Only coaches can cancel assignments'}), 403
        
        coach_profile = CoachProfile.query.filter_by(user_id=current_user.id).first()
        if not coach_profile:
            return jsonify({'error': 'Coach profile not found'}), 404
        
        assignment = CoachAssignment.query.get(assignment_id)
        if not assignment:
            return jsonify({'error': 'Assignment not found'}), 404
        
        if assignment.primary_coach_id != coach_profile.id:
            return jsonify({'error': 'You are not the primary coach for this assignment'}), 403
        
        if assignment.status in ['completed', 'cancelled', 'declined']:
            return jsonify({'error': f'Cannot cancel assignment with status: {assignment.status}'}), 400
        
        data = request.get_json() or {}
        
        assignment.status = 'cancelled'
        assignment.cancel_reason = data.get('reason', '')
        
        db.session.commit()
        
        return jsonify({
            'message': 'Assignment cancelled successfully',
            'assignment': assignment.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Error cancelling assignment: {str(e)}')
        return jsonify({'error': 'Failed to cancel assignment'}), 500

@assignment_bp.route('/customer/current-assignment', methods=['GET'])
@token_required
def get_current_assignment(current_user):
    """Get customer's current active assignment"""
    try:
        if current_user.role != 'customer':
            return jsonify({'error': 'Only customers can access this endpoint'}), 403
        
        customer_profile = CustomerProfile.query.filter_by(user_id=current_user.id).first()
        if not customer_profile:
            return jsonify({'error': 'Customer profile not found'}), 404
        
        today = date.today()
        
        # Find active assignment for today
        assignment = CoachAssignment.query.filter(
            and_(
                CoachAssignment.customer_id == customer_profile.id,
                CoachAssignment.status == 'active',
                CoachAssignment.start_date <= today,
                or_(
                    CoachAssignment.end_date.is_(None),
                    CoachAssignment.end_date >= today
                )
            )
        ).first()
        
        if assignment:
            return jsonify({
                'has_assignment': True,
                'assignment': assignment.to_dict()
            }), 200
        else:
            return jsonify({
                'has_assignment': False,
                'assignment': None
            }), 200
        
    except Exception as e:
        current_app.logger.error(f'Error fetching current assignment: {str(e)}')
        return jsonify({'error': 'Failed to fetch assignment'}), 500
"""
Extension to coach_assignment.py
Add these routes to the existing assignment_bp blueprint
"""

from datetime import datetime

@assignment_bp.route('/coach/assignments/<int:assignment_id>/rate', methods=['POST'])
@token_required
def rate_assignment(current_user, assignment_id):
    """
    Rate a completed assignment
    Body: { rating, feedback }
    """
    try:
        if current_user.role != 'coach':
            return jsonify({'error': 'Only coaches can rate assignments'}), 403
        
        # Get coach profile
        coach_profile = CoachProfile.query.filter_by(user_id=current_user.id).first()
        if not coach_profile:
            return jsonify({'error': 'Coach profile not found'}), 404
        
        # Get assignment
        assignment = CoachAssignment.query.get(assignment_id)
        if not assignment:
            return jsonify({'error': 'Assignment not found'}), 404
        
        # Verify this is the primary coach
        if assignment.primary_coach_id != coach_profile.id:
            return jsonify({'error': 'Only the primary coach can rate this assignment'}), 403
        
        # Get rating data
        data = request.get_json()
        rating = data.get('rating')
        feedback = data.get('feedback', '')
        
        if not rating or rating < 1 or rating > 5:
            return jsonify({'error': 'Rating must be between 1 and 5'}), 400
        
        # Update assignment
        assignment.assignment_rating = rating
        assignment.assignment_feedback = feedback
        assignment.rated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Rating submitted',
            'assignment': assignment.to_dict()
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Error rating assignment: {str(e)}')
        db.session.rollback()
        return jsonify({'error': 'Failed to submit rating'}), 500


@assignment_bp.route('/coach/assignments/history/<int:coach_id>', methods=['GET'])
@token_required
def get_assignment_history(current_user, coach_id):
    """
    Get assignment history with a specific coach
    """
    try:
        if current_user.role != 'coach':
            return jsonify({'error': 'Only coaches can access assignment history'}), 403
        
        # Get current coach profile
        coach_profile = CoachProfile.query.filter_by(user_id=current_user.id).first()
        if not coach_profile:
            return jsonify({'error': 'Coach profile not found'}), 404
        
        # Get assignments where current coach is primary and specified coach is substitute
        assignments = CoachAssignment.query.filter_by(
            primary_coach_id=coach_profile.id,
            substitute_coach_id=coach_id
        ).order_by(CoachAssignment.created_at.desc()).all()
        
        return jsonify({
            'assignments': [a.to_dict() for a in assignments],
            'count': len(assignments)
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Error getting assignment history: {str(e)}')
        return jsonify({'error': 'Failed to get assignment history'}), 500

