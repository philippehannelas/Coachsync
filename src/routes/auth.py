from flask import Blueprint, request, jsonify, current_app
from src.models.user import User, CoachProfile, CustomerProfile, db
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
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.get(data['user_id'])
            if not current_user:
                return jsonify({'message': 'Invalid token'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid token'}), 401
        
        return f(current_user, *args, **kwargs)
    return auth_decorated

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

