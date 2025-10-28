from flask import Blueprint, request, jsonify
from src.models.user import User, CoachProfile, CustomerProfile, TrainingPlan, Exercise, db
from src.routes.auth import token_required
from functools import wraps
import uuid
import jwt
from datetime import datetime, timedelta
from flask import current_app
from werkzeug.security import generate_password_hash

coach_bp = Blueprint('coach', __name__)

def coach_required(f):
    @wraps(f)
    def coach_decorated(current_user, *args, **kwargs):
        if current_user.role != 'coach':
            return jsonify({'message': 'Coach access required'}), 403
        return f(current_user, *args, **kwargs)
    return coach_decorated

@coach_bp.route('/profile', methods=['GET'])
@token_required
@coach_required
def get_coach_profile(current_user):
    try:
        if not current_user.coach_profile:
            return jsonify({'message': 'Coach profile not found'}), 404
        
        return jsonify(current_user.coach_profile.to_dict()), 200
    except Exception as e:
        return jsonify({'message': f'Failed to get coach profile: {str(e)}'}), 500

@coach_bp.route('/profile', methods=['PUT'])
@token_required
@coach_required
def update_coach_profile(current_user):
    try:
        data = request.json
        profile = current_user.coach_profile
        
        if not profile:
            return jsonify({'message': 'Coach profile not found'}), 404
        
        # Update profile fields
        if 'bio' in data:
            profile.bio = data['bio']
        if 'qualifications' in data:
            profile.qualifications = data['qualifications']
        if 'cycle_weeks' in data:
            profile.cycle_weeks = data['cycle_weeks']
        
        db.session.commit()
        return jsonify(profile.to_dict()), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to update profile: {str(e)}'}), 500

@coach_bp.route('/customers', methods=['GET'])
@token_required
@coach_required
def get_customers(current_user):
    try:
        customers = current_user.coach_profile.customers.all()
        customers_data = []
        
        for customer in customers:
            customer_data = customer.to_dict()
            customer_data['user'] = customer.user.to_dict()
            customers_data.append(customer_data)
        
        return jsonify(customers_data), 200
    except Exception as e:
        return jsonify({'message': f'Failed to get customers: {str(e)}'}), 500

@coach_bp.route('/customers', methods=['POST'])
@token_required
@coach_required
def create_customer(current_user):
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['first_name', 'last_name']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'message': f'{field} is required'}), 400
        
        # ✅ FIX: Validate that either email or phone is provided (handle empty strings)
        email = data.get('email', '').strip()
        phone = data.get('phone', '').strip()
        
        if not email and not phone:
            return jsonify({'message': 'Either email or phone number is required'}), 400
        
        # Check if user already exists
        existing_user = None
        if email:
            existing_user = User.query.filter_by(email=email).first()
        if not existing_user and phone:
            existing_user = User.query.filter_by(phone=phone).first()
        
        if existing_user:
            return jsonify({'message': 'User with this email or phone already exists'}), 400
        
        # Create new user
        # Generate a default password if not provided (customer can change it later)
        password = data.get('password', f"temp{uuid.uuid4().hex[:8]}")
        
        user = User(
            id=str(uuid.uuid4()),
            first_name=data['first_name'],
            last_name=data['last_name'],
            email=email if email else None,  # ✅ FIX: Store None instead of empty string
            phone=phone if phone else None,  # ✅ FIX: Store None instead of empty string
            password_hash=generate_password_hash(password),
            role='customer'
        )
        
        db.session.add(user)
        db.session.flush()
        
        # Create customer profile
        # Use initial_credits if provided, otherwise default to 0
        initial_credits = data.get('initial_credits', data.get('session_credits', 0))
        
        customer_profile = CustomerProfile(
            user_id=user.id,
            coach_id=current_user.coach_profile.id,
            session_credits=initial_credits,
            is_active=data.get('is_active', True),
            notes=data.get('notes', '')
        )
        
        db.session.add(customer_profile)
        db.session.commit()
        
        # Return customer data with user info
        customer_data = customer_profile.to_dict()
        customer_data['user'] = user.to_dict()
        
        return jsonify({
            'message': 'Customer created successfully',
            'customer': customer_data
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to create customer: {str(e)}'}), 500

@coach_bp.route('/customers/<customer_id>', methods=['PUT'])
@token_required
@coach_required
def update_customer(current_user, customer_id):
    try:
        data = request.json
        customer = CustomerProfile.query.filter_by(
            id=customer_id, 
            coach_id=current_user.coach_profile.id
        ).first()
        
        if not customer:
            return jsonify({'message': 'Customer not found'}), 404
        
        # Update user fields
        user = customer.user
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'email' in data:
            user.email = data['email']
        if 'phone' in data:
            user.phone = data['phone']
        if 'password' in data and data['password']:
            user.password_hash = generate_password_hash(data['password'])
        
        # Update customer profile fields
        if 'session_credits' in data:
            customer.session_credits = data['session_credits']
        if 'is_active' in data:
            customer.is_active = data['is_active']
        if 'notes' in data:
            customer.notes = data['notes']
        
        db.session.commit()
        
        # Return updated customer data
        customer_data = customer.to_dict()
        customer_data['user'] = user.to_dict()
        
        return jsonify(customer_data), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to update customer: {str(e)}'}), 500

@coach_bp.route('/customers/<customer_id>', methods=['DELETE'])
@token_required
@coach_required
def delete_customer(current_user, customer_id):
    try:
        customer = CustomerProfile.query.filter_by(
            id=customer_id, 
            coach_id=current_user.coach_profile.id
        ).first()
        
        if not customer:
            return jsonify({'message': 'Customer not found'}), 404
        
        # Delete customer profile and user
        user = customer.user
        db.session.delete(customer)
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({'message': 'Customer deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to delete customer: {str(e)}'}), 500

@coach_bp.route('/customers/<customer_id>/credits', methods=['PUT', 'POST'])
@token_required
@coach_required
def update_customer_credits(current_user, customer_id):
    try:
        data = request.json
        customer = CustomerProfile.query.filter_by(
            id=customer_id, 
            coach_id=current_user.coach_profile.id
        ).first()
        
        if not customer:
            return jsonify({'message': 'Customer not found'}), 404
        
        if 'credits' in data:
            # Add credits to existing balance
            customer.session_credits += int(data['credits'])
        elif 'session_credits' in data:
            # Set absolute credit amount
            customer.session_credits = int(data['session_credits'])
        
        db.session.commit()
        
        customer_data = customer.to_dict()
        customer_data['user'] = customer.user.to_dict()
        
        return jsonify(customer_data), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to update credits: {str(e)}'}), 500

@coach_bp.route('/training-plans', methods=['GET'])
@token_required
@coach_required
def get_training_plans(current_user):
    try:
        # Get all training plans created by this coach
        training_plans = TrainingPlan.query.filter_by(
            coach_id=current_user.coach_profile.id
        ).all()
        
        plans_data = []
        for plan in training_plans:
            plan_data = plan.to_dict()
            # Count assigned customers
            plan_data['assigned_customers'] = len(plan.assigned_customer_ids) if plan.assigned_customer_ids else 0
            plans_data.append(plan_data)
        
        return jsonify(plans_data), 200
    except Exception as e:
        return jsonify({'message': f'Failed to get training plans: {str(e)}'}), 500

@coach_bp.route('/training-plans', methods=['POST'])
@token_required
@coach_required
def create_training_plan(current_user):
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['name', 'description']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'message': f'{field} is required'}), 400
        
        # Create training plan
        training_plan = TrainingPlan(
            coach_id=current_user.coach_profile.id,
            name=data['name'],
            description=data['description'],
            difficulty=data.get('difficulty', 'beginner'),
            duration_weeks=data.get('duration_weeks', 4),
            is_active=data.get('is_active', True),
            exercises=data.get('exercises', []),
            assigned_customer_ids=data.get('assigned_customer_ids', [])
        )
        
        db.session.add(training_plan)
        db.session.commit()
        
        return jsonify({
            'message': 'Training plan created successfully',
            'training_plan': training_plan.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to create training plan: {str(e)}'}), 500

@coach_bp.route('/training-plans/<plan_id>', methods=['PUT'])
@token_required
@coach_required
def update_training_plan(current_user, plan_id):
    try:
        data = request.json
        training_plan = TrainingPlan.query.filter_by(
            id=plan_id,
            coach_id=current_user.coach_profile.id
        ).first()
        
        if not training_plan:
            return jsonify({'message': 'Training plan not found'}), 404
        
        # Update fields
        if 'name' in data:
            training_plan.name = data['name']
        if 'description' in data:
            training_plan.description = data['description']
        if 'difficulty' in data:
            training_plan.difficulty = data['difficulty']
        if 'duration_weeks' in data:
            training_plan.duration_weeks = data['duration_weeks']
        if 'is_active' in data:
            training_plan.is_active = data['is_active']
        if 'exercises' in data:
            training_plan.exercises = data['exercises']
        if 'assigned_customer_ids' in data:
            training_plan.assigned_customer_ids = data['assigned_customer_ids']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Training plan updated successfully',
            'training_plan': training_plan.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to update training plan: {str(e)}'}), 500

@coach_bp.route('/training-plans/<plan_id>', methods=['DELETE'])
@token_required
@coach_required
def delete_training_plan(current_user, plan_id):
    try:
        training_plan = TrainingPlan.query.filter_by(
            id=plan_id,
            coach_id=current_user.coach_profile.id
        ).first()
        
        if not training_plan:
            return jsonify({'message': 'Training plan not found'}), 404
        
        db.session.delete(training_plan)
        db.session.commit()
        
        return jsonify({'message': 'Training plan deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to delete training plan: {str(e)}'}), 500
# ✅ NEW: Generate invitation link for customer
@coach_bp.route('/customers/<customer_id>/generate-invite', methods=['POST'])
@token_required
@coach_required
def generate_customer_invite(current_user, customer_id):
    """
    Generate an invitation token and link for a customer.
    Coach can share this link manually with the customer.
    """
    try:
        # Verify customer belongs to this coach
        customer = CustomerProfile.query.filter_by(
            id=customer_id,
            coach_id=current_user.coach_profile.id
        ).first()
        
        if not customer:
            return jsonify({'message': 'Customer not found'}), 404
        
        user = customer.user
        
        # Generate invitation token (valid for 7 days)
        token = jwt.encode({
            'user_id': user.id,
            'type': 'customer_invite',
            'exp': datetime.utcnow() + timedelta(days=7)
        }, current_app.config['SECRET_KEY'], algorithm='HS256')
        
        # Generate invitation link
        # In production, this would be your actual domain
        frontend_url = request.headers.get('Origin', 'https://coachsync-web.onrender.com')
        invite_link = f"{frontend_url}/accept-invite/{token}"
        
        return jsonify({
            'message': 'Invitation link generated successfully',
            'token': token,
            'invite_link': invite_link,
            'expires_in': '7 days',
            'customer': {
                'id': customer.id,
                'name': f"{user.first_name} {user.last_name}",
                'email': user.email,
                'phone': user.phone
            }
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to generate invitation: {str(e)}'}), 500


# ✅ NEW: Resend invitation (regenerate token)
@coach_bp.route('/customers/<customer_id>/resend-invite', methods=['POST'])
@token_required
@coach_required
def resend_customer_invite(current_user, customer_id):
    """
    Regenerate invitation link (useful if previous link expired)
    """
    # This is the same as generate_customer_invite
    return generate_customer_invite(current_user, customer_id)


