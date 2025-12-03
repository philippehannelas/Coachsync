from flask import Blueprint, request, jsonify, current_app
from src.models.user import User, CoachProfile, CustomerProfile, db
from sqlalchemy.orm import joinedload
import jwt
from datetime import datetime, timedelta
from functools import wraps
from werkzeug.security import generate_password_hash

auth_bp = Blueprint('auth', __name__)

def token_required(f):
    @wraps(f)
    def auth_decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            data = jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=["HS256"])
            # Explicitly load profiles to avoid lazy loading issues
            current_user = User.query.options(
                joinedload(User.coach_profile),
                joinedload(User.customer_profile)
            ).get(data["user_id"])
            if not current_user:
                return jsonify({'message': 'Invalid token'}), 401
            
            # Check account status on every token-required request
            if current_user.account_status != 'active':
                return jsonify({'message': 'Account is inactive. Please log in again.'}), 403
            
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid token'}), 401
        
        return f(current_user, *args, **kwargs)
    return auth_decorated

def admin_required(f):
    @wraps(f)
    def admin_decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
            # Explicitly load profiles to avoid lazy loading issues
            current_user = User.query.options(
                joinedload(User.coach_profile),
                joinedload(User.customer_profile)
            ).get(data["user_id"])
            if not current_user:
                return jsonify({'message': 'Invalid token'}), 401
            
            # Check account status
            if current_user.account_status != 'active':
                return jsonify({'message': 'Account is inactive. Please log in again.'}), 403
            
            # Check for admin role
            if current_user.role != 'admin':
                return jsonify({'message': 'Admin access required'}), 403
            
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid token'}), 401
        
        return f(current_user, *args, **kwargs)
    return admin_decorated

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['password', 'first_name', 'last_name', 'role']
        for field in required_fields:
            if field not in data:
                return jsonify({'message': f'{field} is required'}), 400
        
        # Validate that either email or phone is provided
        if not data.get('email') and not data.get('phone'):
            return jsonify({'message': 'Either email or phone number is required'}), 400
        
        # Validate phone number format (8 digits)
        if data.get('phone'):
            phone = data['phone'].strip()
            if not phone.isdigit() or len(phone) != 8:
                return jsonify({'message': 'Phone number must be exactly 8 digits'}), 400
        
        # Check if user already exists
        existing_user = None
        if data.get('email'):
            existing_user = User.query.filter_by(email=data['email']).first()
        if not existing_user and data.get('phone'):
            existing_user = User.query.filter_by(phone=data['phone']).first()
        
        if existing_user:
            return jsonify({'message': 'User with this email or phone already exists'}), 400
        
        # Validate role
        if data['role'] not in ['coach', 'customer']:
            return jsonify({'message': 'Role must be either coach or customer'}), 400
        
        # Create user with direct password hashing
        user = User(
            email=data.get('email'),
            phone=data.get('phone'),
            first_name=data['first_name'],
            last_name=data['last_name'],
            role=data['role'],
            password_hash=generate_password_hash(data['password'])  # Direct hashing
        )
        
        db.session.add(user)
        db.session.flush()  # Get the user ID
        
        # Create profile based on role
        if data['role'] == 'coach':
            profile = CoachProfile(user_id=user.id)
            db.session.add(profile)
        else:
            profile = CustomerProfile(user_id=user.id)
            db.session.add(profile)
        
        db.session.commit()
        
        return jsonify({
            'message': 'User registered successfully',
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Registration failed: {str(e)}'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.json
        
        if not data.get('password'):
            return jsonify({'message': 'Password is required'}), 400
        
        if not data.get('email') and not data.get('phone'):
            return jsonify({'message': 'Email or phone number is required'}), 400
        
        # Find user by email or phone
        user = None
        if data.get('email'):
            user = User.query.filter_by(email=data['email']).first()
        elif data.get('phone'):
            user = User.query.filter_by(phone=data['phone']).first()
        
        # Debug logging
        print(f"Login attempt for: {data.get('email') or data.get('phone')}")
        print(f"User found: {user is not None}")
        if user:
            print(f"Password check result: {user.check_password(data['password'])}")
            print(f"Stored hash: {user.password_hash[:50]}...")
        
        if not user or not user.check_password(data['password']):
            return jsonify({'message': 'Invalid credentials'}), 401
        
        # Check account status
        if user.account_status != 'active':
            return jsonify({'message': f'Account is {user.account_status}. Please contact support.'}), 403
        
        # Generate JWT token
        token = jwt.encode({
            'user_id': user.id,
            'role': user.role,
            'exp': datetime.utcnow() + timedelta(days=7)
        }, current_app.config['SECRET_KEY'], algorithm='HS256')
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({'message': f'Login failed: {str(e)}'}), 500

# ✅ NEW: Add logout endpoint
@auth_bp.route('/logout', methods=['POST'])
@token_required
def logout(current_user):
    """
    Logout endpoint - In a JWT-based system, logout is handled client-side
    by removing the token. This endpoint exists to validate the token and
    provide a consistent API response.
    """
    try:
        return jsonify({
            'message': 'Logout successful'
        }), 200
    except Exception as e:
        return jsonify({'message': f'Logout failed: {str(e)}'}), 500

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    try:
        user_data = current_user.to_dict()
        
        # Add profile data based on role
        if current_user.role == 'coach' and current_user.coach_profile:
            user_data['profile'] = current_user.coach_profile.to_dict()
        elif current_user.role == 'customer' and current_user.customer_profile:
            user_data['profile'] = current_user.customer_profile.to_dict()
        
        return jsonify(user_data), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to get user data: {str(e)}'}), 500
# ✅ NEW: Validate invitation token
@auth_bp.route('/validate-invite/<token>', methods=['GET'])
def validate_invite_token(token):
    """
    Validate an invitation token and return customer information.
    Used by the frontend to check if the invitation link is valid.
    """
    try:
        # Decode the token
        data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        
        # Verify it's an invitation token
        if data.get('type') != 'customer_invite':
            return jsonify({'message': 'Invalid invitation token'}), 400
        
        # Get user information
        user = User.query.get(data['user_id'])
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        if user.role != 'customer':
            return jsonify({'message': 'Invalid invitation'}), 400
        
        # Get customer profile and coach info
        customer_profile = CustomerProfile.query.filter_by(user_id=user.id).first()
        if not customer_profile:
            return jsonify({'message': 'Customer profile not found'}), 404
        
        coach_profile = CoachProfile.query.get(customer_profile.coach_id)
        coach_user = User.query.get(coach_profile.user_id) if coach_profile else None
        
        return jsonify({
            'valid': True,
            'customer': {
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email,
                'phone': user.phone
            },
            'coach': {
                'name': f"{coach_user.first_name} {coach_user.last_name}" if coach_user else 'Your Coach',
                'email': coach_user.email if coach_user else None
            } if coach_user else None
        }), 200
        
    except jwt.ExpiredSignatureError:
        return jsonify({
            'valid': False,
            'message': 'Invitation link has expired. Please contact your coach for a new invitation.'
        }), 400
    except jwt.InvalidTokenError:
        return jsonify({
            'valid': False,
            'message': 'Invalid invitation link.'
        }), 400
    except Exception as e:
        return jsonify({
            'valid': False,
            'message': f'Failed to validate invitation: {str(e)}'
        }), 500
    
    
# ✅ NEW: Accept invitation and set password
@auth_bp.route('/accept-invite', methods=['POST'])
def accept_invitation():
    """
    Customer accepts invitation by setting their password.
    After this, they can log in normally.
    """
    try:
        data = request.json
        
        # Validate required fields
        if not data.get('token'):
            return jsonify({'message': 'Invitation token is required'}), 400
        
        if not data.get('password'):
            return jsonify({'message': 'Password is required'}), 400
        
        # Validate password strength (optional but recommended)
        password = data['password']
        if len(password) < 6:
            return jsonify({'message': 'Password must be at least 6 characters'}), 400
        
        # Decode and validate token
        try:
            token_data = jwt.decode(data['token'], current_app.config['SECRET_KEY'], algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Invitation link has expired. Please contact your coach.'}), 400
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid invitation link.'}), 400
        
        # Verify it's an invitation token
        if token_data.get('type') != 'customer_invite':
            return jsonify({'message': 'Invalid invitation token'}), 400
        
        # Get user
        user = User.query.get(token_data['user_id'])
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        if user.role != 'customer':
            return jsonify({'message': 'Invalid invitation'}), 400
        
        # Update password
        user.password_hash = generate_password_hash(password)
        db.session.commit()
        
        # Generate login token
        login_token = jwt.encode({
            'user_id': user.id,
            'role': user.role,
            'exp': datetime.utcnow() + timedelta(days=7)
        }, current_app.config['SECRET_KEY'], algorithm='HS256')
        
        return jsonify({
            'message': 'Password set successfully. You can now log in.',
            'token': login_token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to accept invitation: {str(e)}'}), 500
    
    
    
