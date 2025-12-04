from flask import Blueprint, request, jsonify, current_app
import jwt
import uuid
from src.models.user import User, db, PasswordResetToken
from src.routes.auth import token_required, admin_required
from datetime import datetime, timedelta

customer_management_bp = Blueprint("customer_management", __name__)

@customer_management_bp.route("/coach/customers/<customer_id>/status", methods=["PUT"])
@token_required
def update_customer_status(current_user, customer_id):
    """
    Allows a coach to update the status of one of their customers.
    """
    if current_user.role != "coach":
        return jsonify({"message": "Unauthorized"}), 403

    data = request.json
    new_status = data.get("status")
    status_reason = data.get("reason", "")

    if not new_status or new_status not in ["active", "inactive", "suspended"]:
        return jsonify({"message": "Invalid status provided"}), 400

    customer = User.query.get(customer_id)
    if not customer or customer.role != "customer":
        return jsonify({"message": "Customer not found"}), 404

    # Verify the customer belongs to the coach
    if customer.customer_profile.coach_id != current_user.coach_profile.id:
        return jsonify({"message": "Customer not assigned to this coach"}), 403

    # Update status
    customer.account_status = new_status
    customer.status_changed_at = datetime.utcnow()
    customer.status_changed_by = current_user.id
    customer.status_reason = status_reason

    db.session.commit()

    return jsonify({"message": f"Customer status updated to {new_status}"}), 200

@customer_management_bp.route("/coach/customers/invite", methods=["POST"])
@token_required
def invite_customer(current_user):
    """
    Allows a coach to invite a new customer by email.
    This creates a user with a temporary password and sends a reset link.
    """
    if current_user.role != "coach":
        return jsonify({"message": "Unauthorized"}), 403

    data = request.json
    email = data.get("email")
    first_name = data.get("first_name")
    last_name = data.get("last_name")

    if not email or not first_name or not last_name:
        return jsonify({"message": "Missing required fields (email, first_name, last_name)"}), 400

    # 1. Check if user already exists
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({"message": "User with this email already exists"}), 409

    try:
        # 2. Create a temporary user account
        temp_password = str(uuid.uuid4()) # Use a random UUID as a temporary password
        new_user = User(
            email=email,
            first_name=first_name,
            last_name=last_name,
            role='customer',
            account_status='inactive' # Set to inactive until they set their password
        )
        new_user.set_password(temp_password)
        db.session.add(new_user)
        db.session.flush() # Get the user ID before commit

        # 3. Create the customer profile and link it to the coach
        from src.models.user import CustomerProfile # Import here to avoid circular dependency if needed
        customer_profile = CustomerProfile(
            user_id=new_user.id,
            coach_id=current_user.coach_profile.id,
            is_active=True # Coach is inviting them, so they are active in the coach's list
        )
        db.session.add(customer_profile)

        # 4. Generate a secure, time-limited token for password setup
        reset_token = jwt.encode({
            'user_id': new_user.id,
            'type': 'password_setup', # New type for initial setup
            'exp': datetime.utcnow() + timedelta(days=7) # Token expires in 7 days
        }, current_app.config['SECRET_KEY'], algorithm='HS256')

        # 5. Store the token in the database (PasswordResetToken table - assumed to exist from previous phase)
        from src.models.user import PasswordResetToken # Assuming this model exists
        token_record = PasswordResetToken(
            user_id=new_user.id,
            token=reset_token,
            expires_at=datetime.utcnow() + timedelta(days=7),
            token_type='password_setup'
        )
        db.session.add(token_record)

        db.session.commit()

        # 6. TODO: Implement email sending logic here
        # In a real app, you would send an email with a link like:
        # f"https://yourdomain.com/accept-invite?token={reset_token}"

        return jsonify({
            "message": f"Customer {email} invited successfully. Password setup link generated.",
            "setup_token": reset_token # For testing/debugging
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to invite customer: {str(e)}"}), 500