from flask import Blueprint, request, jsonify, session
from src.models.user import db, CoachAssignment, CoachProfile, CustomerProfile, User
from datetime import datetime, date
from sqlalchemy import and_, or_
from functools import wraps

assignment_bp = Blueprint('coach_assignment', __name__)

def require_auth(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function

def get_current_user():
    """Get current logged-in user"""
    user_id = session.get('user_id')
    if not user_id:
        return None
    return User.query.get(user_id)

@assignment_bp.route('/coach/assignments', methods=['POST'])
@require_auth
def create_assignment():
    """Create temporary coach assignment(s)"""
    try:
        user = get_current_user()
        if not user or user.role != 'coach':
            return jsonify({'error': 'Only coaches can create assignments'}), 403
        
        coach_profile = CoachProfile.query.filter_by(user_id=user.id).first()
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
        substitute_user = User.query.filter_by(email=data['substitute_coach_email'], role='coach').first()
        if not substitute_user:
            return jsonify({'error': 'Substitute coach not found or not a coach'}), 404
        
        substitute_coach = CoachProfile.query.filter_by(user_id=substitute_user.id).first()
        if not substitute_coach:
            return jsonify({'error': 'Substitute coach profile not found'}), 404
        
        # Cannot assign to self
        if substitute_coach.id == coach_profile.id:
            return jsonify({'error': 'Cannot assign yourself as substitute'}), 400
        
        # Parse dates
        try:
            start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
            end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date() if data.get('end_date') else None
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        # Validate dates
        if start_date < date.today():
            return jsonify({'error': 'Start date cannot be in the past'}), 400
        
        if end_date and end_date < start_date:
            return jsonify({'error': 'End date must be after start date'}), 400
        
        # Get permissions
        permissions = data.get('permissions', {})
        
        # Create assignments for each customer
        assignments = []
        errors = []
        
        for customer_id in data['customer_ids']:
            # Verify customer belongs to this coach
            customer = CustomerProfile.query.get(customer_id)
            if not customer:
                errors.append(f"Customer {customer_id} not found")
                continue
            
            if customer.coach_id != coach_profile.id:
                errors.append(f"Customer {customer_id} does not belong to you")
                continue
            
            # Check for overlapping assignments
            overlapping = CoachAssignment.query.filter(
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
                        CoachAssignment.start_date <= (end_date if end_date else start_date),
                        or_(
                            CoachAssignment.end_date.is_(None),
                            CoachAssignment.end_date >= start_date
                        )
                    ) if end_date else False
                )
            ).first()
            
            if overlapping:
                errors.append(f"Customer {customer_id} already has an overlapping assignment")
                continue
            
            # Create assignment
            assignment = CoachAssignment(
                customer_id=customer_id,
                primary_coach_id=coach_profile.id,
                substitute_coach_id=substitute_coach.id,
                start_date=start_date,
                end_date=end_date,
                reason=data.get('reason'),
                can_view_history=permissions.get('can_view_history', True),
                can_book_sessions=permissions.get('can_book_sessions', True),
                can_edit_plans=permissions.get('can_edit_plans', False),
                can_view_notes=permissions.get('can_view_notes', True),
                can_add_notes=permissions.get('can_add_notes', True),
                created_by=user.id
            )
            
            db.session.add(assignment)
            assignments.append(assignment)
        
        if not assignments:
            return jsonify({
                'error': 'No valid assignments created',
                'errors': errors
            }), 400
        
        db.session.commit()
        
        # TODO: Send notifications to substitute coach and customers
        
        return jsonify({
            'success': True,
            'assignments': [a.to_dict() for a in assignments],
            'errors': errors if errors else None,
            'message': f'{len(assignments)} assignment(s) created successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@assignment_bp.route('/coach/assignments/given', methods=['GET'])
@require_auth
def get_assignments_given():
    """Get assignments created by this coach"""
    try:
        user = get_current_user()
        if not user or user.role != 'coach':
            return jsonify({'error': 'Only coaches can view assignments'}), 403
        
        coach_profile = CoachProfile.query.filter_by(user_id=user.id).first()
        if not coach_profile:
            return jsonify({'error': 'Coach profile not found'}), 404
        
        # Get query parameters
        status_filter = request.args.get('status')
        customer_id = request.args.get('customer_id')
        
        # Build query
        query = CoachAssignment.query.filter_by(primary_coach_id=coach_profile.id)
        
        if status_filter:
            query = query.filter_by(status=status_filter)
        
        if customer_id:
            query = query.filter_by(customer_id=customer_id)
        
        assignments = query.order_by(CoachAssignment.created_at.desc()).all()
        
        return jsonify({
            'assignments': [a.to_dict(include_customer=True, include_coaches=True) for a in assignments]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@assignment_bp.route('/coach/assignments/received', methods=['GET'])
@require_auth
def get_assignments_received():
    """Get assignments where this coach is the substitute"""
    try:
        user = get_current_user()
        if not user or user.role != 'coach':
            return jsonify({'error': 'Only coaches can view assignments'}), 403
        
        coach_profile = CoachProfile.query.filter_by(user_id=user.id).first()
        if not coach_profile:
            return jsonify({'error': 'Coach profile not found'}), 404
        
        # Get query parameters
        status_filter = request.args.get('status')
        
        # Build query
        query = CoachAssignment.query.filter_by(substitute_coach_id=coach_profile.id)
        
        if status_filter:
            query = query.filter_by(status=status_filter)
        
        assignments = query.order_by(CoachAssignment.created_at.desc()).all()
        
        return jsonify({
            'assignments': [a.to_dict(include_customer=True, include_coaches=True) for a in assignments]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@assignment_bp.route('/coach/assignments/<assignment_id>/accept', methods=['POST'])
@require_auth
def accept_assignment(assignment_id):
    """Accept a substitute assignment"""
    try:
        user = get_current_user()
        if not user or user.role != 'coach':
            return jsonify({'error': 'Only coaches can accept assignments'}), 403
        
        coach_profile = CoachProfile.query.filter_by(user_id=user.id).first()
        if not coach_profile:
            return jsonify({'error': 'Coach profile not found'}), 404
        
        assignment = CoachAssignment.query.get(assignment_id)
        if not assignment:
            return jsonify({'error': 'Assignment not found'}), 404
        
        # Verify this coach is the substitute
        if assignment.substitute_coach_id != coach_profile.id:
            return jsonify({'error': 'You are not the substitute coach for this assignment'}), 403
        
        # Can only accept pending assignments
        if assignment.status != 'pending':
            return jsonify({'error': f'Cannot accept assignment with status: {assignment.status}'}), 400
        
        # Accept the assignment
        assignment.accepted_at = datetime.utcnow()
        
        # If start date is today or in the past, activate immediately
        if assignment.start_date <= date.today():
            assignment.status = 'active'
        # Otherwise, it will be activated by cron job on start_date
        
        db.session.commit()
        
        # TODO: Send notifications to primary coach and customer
        
        return jsonify({
            'success': True,
            'assignment': assignment.to_dict(include_customer=True, include_coaches=True),
            'message': 'Assignment accepted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@assignment_bp.route('/coach/assignments/<assignment_id>/decline', methods=['POST'])
@require_auth
def decline_assignment(assignment_id):
    """Decline a substitute assignment"""
    try:
        user = get_current_user()
        if not user or user.role != 'coach':
            return jsonify({'error': 'Only coaches can decline assignments'}), 403
        
        coach_profile = CoachProfile.query.filter_by(user_id=user.id).first()
        if not coach_profile:
            return jsonify({'error': 'Coach profile not found'}), 404
        
        assignment = CoachAssignment.query.get(assignment_id)
        if not assignment:
            return jsonify({'error': 'Assignment not found'}), 404
        
        # Verify this coach is the substitute
        if assignment.substitute_coach_id != coach_profile.id:
            return jsonify({'error': 'You are not the substitute coach for this assignment'}), 403
        
        # Can only decline pending assignments
        if assignment.status != 'pending':
            return jsonify({'error': f'Cannot decline assignment with status: {assignment.status}'}), 400
        
        data = request.get_json() or {}
        
        # Decline the assignment
        assignment.status = 'declined'
        assignment.declined_at = datetime.utcnow()
        assignment.declined_reason = data.get('reason')
        
        db.session.commit()
        
        # TODO: Send notification to primary coach
        
        return jsonify({
            'success': True,
            'assignment': assignment.to_dict(include_customer=True, include_coaches=True),
            'message': 'Assignment declined'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@assignment_bp.route('/coach/assignments/<assignment_id>/cancel', methods=['POST'])
@require_auth
def cancel_assignment(assignment_id):
    """Cancel an assignment (by primary coach)"""
    try:
        user = get_current_user()
        if not user or user.role != 'coach':
            return jsonify({'error': 'Only coaches can cancel assignments'}), 403
        
        coach_profile = CoachProfile.query.filter_by(user_id=user.id).first()
        if not coach_profile:
            return jsonify({'error': 'Coach profile not found'}), 404
        
        assignment = CoachAssignment.query.get(assignment_id)
        if not assignment:
            return jsonify({'error': 'Assignment not found'}), 404
        
        # Verify this coach is the primary coach
        if assignment.primary_coach_id != coach_profile.id:
            return jsonify({'error': 'Only the primary coach can cancel this assignment'}), 403
        
        # Can only cancel pending or active assignments
        if assignment.status not in ['pending', 'active']:
            return jsonify({'error': f'Cannot cancel assignment with status: {assignment.status}'}), 400
        
        data = request.get_json() or {}
        
        # Cancel the assignment
        assignment.status = 'cancelled'
        assignment.cancelled_at = datetime.utcnow()
        assignment.cancelled_by = user.id
        assignment.cancellation_reason = data.get('reason')
        
        db.session.commit()
        
        # TODO: Send notifications to substitute coach and customer
        
        return jsonify({
            'success': True,
            'assignment': assignment.to_dict(include_customer=True, include_coaches=True),
            'message': 'Assignment cancelled successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@assignment_bp.route('/customer/current-assignment', methods=['GET'])
@require_auth
def get_current_assignment():
    """Get customer's current coach assignment"""
    try:
        user = get_current_user()
        if not user or user.role != 'customer':
            return jsonify({'error': 'Only customers can view their assignment'}), 403
        
        customer_profile = CustomerProfile.query.filter_by(user_id=user.id).first()
        if not customer_profile:
            return jsonify({'error': 'Customer profile not found'}), 404
        
        # Find active assignment
        today = date.today()
        assignment = CoachAssignment.query.filter(
            CoachAssignment.customer_id == customer_profile.id,
            CoachAssignment.status == 'active',
            CoachAssignment.start_date <= today,
            or_(
                CoachAssignment.end_date.is_(None),
                CoachAssignment.end_date >= today
            )
        ).first()
        
        if not assignment:
            return jsonify({
                'has_assignment': False,
                'assignment': None
            }), 200
        
        return jsonify({
            'has_assignment': True,
            'assignment': assignment.to_dict(include_coaches=True)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@assignment_bp.route('/cron/update-assignment-statuses', methods=['POST'])
def update_assignment_statuses():
    """Cron job to update assignment statuses daily"""
    try:
        # Verify cron secret token
        import os
        token = request.headers.get('X-Cron-Secret')
        if token != os.environ.get('CRON_SECRET', 'dev-secret-123'):
            return jsonify({'error': 'Unauthorized'}), 401
        
        today = date.today()
        updated_count = 0
        
        # Activate pending assignments that have been accepted and start today
        pending_to_activate = CoachAssignment.query.filter(
            CoachAssignment.status == 'pending',
            CoachAssignment.accepted_at.isnot(None),
            CoachAssignment.start_date <= today
        ).all()
        
        for assignment in pending_to_activate:
            assignment.status = 'active'
            updated_count += 1
        
        # Complete active assignments that have ended
        active_to_complete = CoachAssignment.query.filter(
            CoachAssignment.status == 'active',
            CoachAssignment.end_date < today
        ).all()
        
        for assignment in active_to_complete:
            assignment.status = 'completed'
            assignment.completed_at = datetime.utcnow()
            updated_count += 1
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'updated_count': updated_count,
            'activated': len(pending_to_activate),
            'completed': len(active_to_complete)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
