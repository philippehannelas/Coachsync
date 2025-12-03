from flask import Blueprint, request, jsonify
from src.models.user import User, CustomerProfile, db
from src.routes.auth import token_required
from datetime import datetime

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
    customer_profile = CustomerProfile.query.filter_by(user_id=customer.id).first()
    
    if not customer_profile or customer_profile.coach_id != current_user.coach_profile.id:
        return jsonify({"message": "Customer not assigned to this coach"}), 403

    # Update status
    customer.account_status = new_status
    customer.status_changed_at = datetime.utcnow()
    customer.status_changed_by = current_user.id
    customer.status_reason = status_reason

    db.session.commit()

    return jsonify({"message": f"Customer status updated to {new_status}"}), 200
