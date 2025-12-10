from flask import Blueprint, request, jsonify
from src.models.user import db, CoachProfile, CustomerProfile, Package, PackageSubscription, RecurringSchedule, Booking
from src.routes.auth import token_required
from functools import wraps
import uuid
from datetime import datetime, timedelta, date, time
from dateutil.relativedelta import relativedelta

package_bp = Blueprint('package', __name__)

def coach_required(f):
    @wraps(f)
    def coach_decorated(current_user, *args, **kwargs):
        if current_user.role != 'coach':
            return jsonify({'message': 'Coach access required'}), 403
        return f(current_user, *args, **kwargs)
    return coach_decorated

# ============================================================================
# PACKAGE CRUD OPERATIONS
# ============================================================================

@package_bp.route('/', methods=['POST'])
@token_required
@coach_required
def create_package(current_user):
    """Create a new customizable package"""
    try:
        data = request.json
        coach_profile = current_user.coach_profile
        
        if not coach_profile:
            return jsonify({'message': 'Coach profile not found'}), 404
        
        # Validate required fields
        if not data.get('name') or not data.get('credits_per_period'):
            return jsonify({'message': 'Package name and credits_per_period are required'}), 400
        
        # Create package
        package = Package(
            id=str(uuid.uuid4()),
            coach_id=coach_profile.id,
            name=data['name'],
            description=data.get('description'),
            credits_per_period=data['credits_per_period'],
            is_unlimited=data.get('is_unlimited', False),
            price=data.get('price'),
            currency=data.get('currency', 'USD'),
            period_type=data.get('period_type', 'monthly'),
            auto_renew=data.get('auto_renew', True),
            valid_days=data.get('valid_days'),
            valid_start_time=datetime.strptime(data['valid_start_time'], '%H:%M').time() if data.get('valid_start_time') else None,
            valid_end_time=datetime.strptime(data['valid_end_time'], '%H:%M').time() if data.get('valid_end_time') else None,
            is_active=data.get('is_active', True)
        )
        
        db.session.add(package)
        db.session.commit()
        
        return jsonify({
            'message': 'Package created successfully',
            'package': package.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to create package: {str(e)}'}), 500


@package_bp.route('/', methods=['GET'])
@token_required
@coach_required
def get_packages(current_user):
    """Get all packages for the coach"""
    try:
        coach_profile = current_user.coach_profile
        if not coach_profile:
            return jsonify({'message': 'Coach profile not found'}), 404
        
        packages = Package.query.filter_by(coach_id=coach_profile.id).all()
        
        return jsonify({
            'packages': [pkg.to_dict() for pkg in packages]
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to get packages: {str(e)}'}), 500


@package_bp.route('/<package_id>', methods=['GET'])
@token_required
@coach_required
def get_package(current_user, package_id):
    """Get a specific package"""
    try:
        coach_profile = current_user.coach_profile
        if not coach_profile:
            return jsonify({'message': 'Coach profile not found'}), 404
        
        package = Package.query.filter_by(id=package_id, coach_id=coach_profile.id).first()
        
        if not package:
            return jsonify({'message': 'Package not found'}), 404
        
        return jsonify(package.to_dict()), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to get package: {str(e)}'}), 500


@package_bp.route('/<package_id>', methods=['PUT'])
@token_required
@coach_required
def update_package(current_user, package_id):
    """Update a package"""
    try:
        coach_profile = current_user.coach_profile
        if not coach_profile:
            return jsonify({'message': 'Coach profile not found'}), 404
        
        package = Package.query.filter_by(id=package_id, coach_id=coach_profile.id).first()
        
        if not package:
            return jsonify({'message': 'Package not found'}), 404
        
        data = request.json
        
        # Update fields
        if 'name' in data:
            package.name = data['name']
        if 'description' in data:
            package.description = data['description']
        if 'credits_per_period' in data:
            package.credits_per_period = data['credits_per_period']
        if 'is_unlimited' in data:
            package.is_unlimited = data['is_unlimited']
        if 'price' in data:
            package.price = data['price']
        if 'currency' in data:
            package.currency = data['currency']
        if 'period_type' in data:
            package.period_type = data['period_type']
        if 'auto_renew' in data:
            package.auto_renew = data['auto_renew']
        if 'valid_days' in data:
            package.valid_days = data['valid_days']
        if 'valid_start_time' in data:
            package.valid_start_time = datetime.strptime(data['valid_start_time'], '%H:%M').time() if data['valid_start_time'] else None
        if 'valid_end_time' in data:
            package.valid_end_time = datetime.strptime(data['valid_end_time'], '%H:%M').time() if data['valid_end_time'] else None
        if 'is_active' in data:
            package.is_active = data['is_active']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Package updated successfully',
            'package': package.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to update package: {str(e)}'}), 500


@package_bp.route('/<package_id>', methods=['DELETE'])
@token_required
@coach_required
def delete_package(current_user, package_id):
    """Delete a package"""
    try:
        coach_profile = current_user.coach_profile
        if not coach_profile:
            return jsonify({'message': 'Coach profile not found'}), 404
        
        package = Package.query.filter_by(id=package_id, coach_id=coach_profile.id).first()
        
        if not package:
            return jsonify({'message': 'Package not found'}), 404
        
        # Check if package has active subscriptions
        active_subs = PackageSubscription.query.filter_by(
            package_id=package_id,
            status='active'
        ).count()
        
        if active_subs > 0:
            return jsonify({
                'message': f'Cannot delete package with {active_subs} active subscriptions. Cancel subscriptions first.'
            }), 400
        
        db.session.delete(package)
        db.session.commit()
        
        return jsonify({'message': 'Package deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to delete package: {str(e)}'}), 500


# ============================================================================
# PACKAGE SUBSCRIPTION OPERATIONS
# ============================================================================

@package_bp.route('/subscriptions', methods=['POST'])
@token_required
@coach_required
def create_subscription(current_user):
    """Assign a package to a customer (create subscription)"""
    try:
        data = request.json
        coach_profile = current_user.coach_profile
        
        if not coach_profile:
            return jsonify({'message': 'Coach profile not found'}), 404
        
        # Validate required fields
        if not data.get('package_id') or not data.get('customer_id'):
            return jsonify({'message': 'package_id and customer_id are required'}), 400
        
        # Verify package belongs to coach
        package = Package.query.filter_by(
            id=data['package_id'],
            coach_id=coach_profile.id
        ).first()
        
        if not package:
            return jsonify({'message': 'Package not found'}), 404
        
        # Verify customer belongs to coach
        customer = CustomerProfile.query.filter_by(
            id=data['customer_id'],
            coach_id=coach_profile.id
        ).first()
        
        if not customer:
            return jsonify({'message': 'Customer not found'}), 404
        
        # Calculate dates based on period type
        start_date = datetime.strptime(data.get('start_date', date.today().isoformat()), '%Y-%m-%d').date()
        
        if package.period_type == 'weekly':
            next_renewal = start_date + timedelta(weeks=1)
            end_date = next_renewal if not package.auto_renew else None
        elif package.period_type == 'monthly':
            next_renewal = start_date + relativedelta(months=1)
            end_date = next_renewal if not package.auto_renew else None
        elif package.period_type == 'quarterly':
            next_renewal = start_date + relativedelta(months=3)
            end_date = next_renewal if not package.auto_renew else None
        elif package.period_type == 'yearly':
            next_renewal = start_date + relativedelta(years=1)
            end_date = next_renewal if not package.auto_renew else None
        else:  # one_time
            next_renewal = None
            end_date = start_date + relativedelta(months=1)  # Default 1 month validity
        
        # Create subscription
        subscription = PackageSubscription(
            id=str(uuid.uuid4()),
            package_id=package.id,
            customer_id=customer.id,
            coach_id=coach_profile.id,
            start_date=start_date,
            end_date=end_date,
            next_renewal_date=next_renewal,
            credits_allocated=package.credits_per_period if not package.is_unlimited else 999999,
            credits_used=0,
            credits_remaining=package.credits_per_period if not package.is_unlimited else 999999,
            status='active',
            auto_renew=package.auto_renew
        )
        
        db.session.add(subscription)
        
        # Also update customer's session_credits (for backward compatibility)
        customer.session_credits += package.credits_per_period if not package.is_unlimited else 999999
        
        db.session.commit()
        
        return jsonify({
            'message': 'Subscription created successfully',
            'subscription': subscription.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to create subscription: {str(e)}'}), 500


@package_bp.route('/subscriptions', methods=['GET'])
@token_required
@coach_required
def get_subscriptions(current_user):
    """Get all subscriptions for the coach"""
    try:
        coach_profile = current_user.coach_profile
        if not coach_profile:
            return jsonify({'message': 'Coach profile not found'}), 404
        
        subscriptions = PackageSubscription.query.filter_by(coach_id=coach_profile.id).all()
        
        return jsonify({
            'subscriptions': [sub.to_dict() for sub in subscriptions]
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to get subscriptions: {str(e)}'}), 500


@package_bp.route('/subscriptions/customer/<customer_id>', methods=['GET'])
@token_required
@coach_required
def get_customer_subscriptions(current_user, customer_id):
    """Get all subscriptions for a specific customer"""
    try:
        coach_profile = current_user.coach_profile
        if not coach_profile:
            return jsonify({'message': 'Coach profile not found'}), 404
        
        subscriptions = PackageSubscription.query.filter_by(
            customer_id=customer_id,
            coach_id=coach_profile.id
        ).all()
        
        return jsonify({
            'subscriptions': [sub.to_dict() for sub in subscriptions]
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to get customer subscriptions: {str(e)}'}), 500


@package_bp.route('/subscriptions/<subscription_id>/cancel', methods=['POST'])
@token_required
@coach_required
def cancel_subscription(current_user, subscription_id):
    """Cancel a subscription"""
    try:
        coach_profile = current_user.coach_profile
        if not coach_profile:
            return jsonify({'message': 'Coach profile not found'}), 404
        
        subscription = PackageSubscription.query.filter_by(
            id=subscription_id,
            coach_id=coach_profile.id
        ).first()
        
        if not subscription:
            return jsonify({'message': 'Subscription not found'}), 404
        
        data = request.json or {}
        
        subscription.status = 'cancelled'
        subscription.cancelled_at = datetime.utcnow()
        subscription.cancellation_reason = data.get('reason')
        subscription.auto_renew = False
        
        db.session.commit()
        
        return jsonify({
            'message': 'Subscription cancelled successfully',
            'subscription': subscription.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to cancel subscription: {str(e)}'}), 500


# ============================================================================
# RECURRING SCHEDULE OPERATIONS
# ============================================================================

@package_bp.route('/recurring-schedules', methods=['POST'])
@token_required
@coach_required
def create_recurring_schedule(current_user):
    """Create a recurring schedule for a subscription"""
    try:
        data = request.json
        coach_profile = current_user.coach_profile
        
        if not coach_profile:
            return jsonify({'message': 'Coach profile not found'}), 404
        
        # Validate required fields
        required_fields = ['subscription_id', 'customer_id', 'day_of_week', 'start_time', 'end_time']
        for field in required_fields:
            if field not in data:
                return jsonify({'message': f'{field} is required'}), 400
        
        # Verify subscription
        subscription = PackageSubscription.query.filter_by(
            id=data['subscription_id'],
            coach_id=coach_profile.id
        ).first()
        
        if not subscription:
            return jsonify({'message': 'Subscription not found'}), 404
        
        # Create recurring schedule
        schedule = RecurringSchedule(
            id=str(uuid.uuid4()),
            subscription_id=subscription.id,
            customer_id=data['customer_id'],
            coach_id=coach_profile.id,
            day_of_week=data['day_of_week'],
            start_time=datetime.strptime(data['start_time'], '%H:%M').time(),
            end_time=datetime.strptime(data['end_time'], '%H:%M').time(),
            auto_book_enabled=data.get('auto_book_enabled', True),
            book_weeks_ahead=data.get('book_weeks_ahead', 4),
            is_active=True
        )
        
        db.session.add(schedule)
        db.session.commit()
        
        # Trigger auto-booking if enabled
        if schedule.auto_book_enabled:
            create_bookings_from_schedule(schedule)
        
        return jsonify({
            'message': 'Recurring schedule created successfully',
            'schedule': schedule.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to create recurring schedule: {str(e)}'}), 500


@package_bp.route('/recurring-schedules', methods=['GET'])
@token_required
@coach_required
def get_recurring_schedules(current_user):
    """Get all recurring schedules for the coach"""
    try:
        coach_profile = current_user.coach_profile
        if not coach_profile:
            return jsonify({'message': 'Coach profile not found'}), 404
        
        schedules = RecurringSchedule.query.filter_by(coach_id=coach_profile.id).all()
        
        return jsonify({
            'schedules': [schedule.to_dict() for schedule in schedules]
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to get recurring schedules: {str(e)}'}), 500


@package_bp.route('/recurring-schedules/<schedule_id>', methods=['DELETE'])
@token_required
@coach_required
def delete_recurring_schedule(current_user, schedule_id):
    """Delete a recurring schedule"""
    try:
        coach_profile = current_user.coach_profile
        if not coach_profile:
            return jsonify({'message': 'Coach profile not found'}), 404
        
        schedule = RecurringSchedule.query.filter_by(
            id=schedule_id,
            coach_id=coach_profile.id
        ).first()
        
        if not schedule:
            return jsonify({'message': 'Recurring schedule not found'}), 404
        
        db.session.delete(schedule)
        db.session.commit()
        
        return jsonify({'message': 'Recurring schedule deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to delete recurring schedule: {str(e)}'}), 500


# ============================================================================
# AUTO-BOOKING LOGIC
# ============================================================================

def create_bookings_from_schedule(schedule):
    """Create bookings from a recurring schedule"""
    try:
        subscription = schedule.subscription
        
        # Calculate how many weeks ahead to book
        weeks_ahead = schedule.book_weeks_ahead
        today = date.today()
        end_date = today + timedelta(weeks=weeks_ahead)
        
        # Find the next occurrence of the day_of_week
        days_ahead = schedule.day_of_week - today.weekday()
        if days_ahead < 0:  # Target day already happened this week
            days_ahead += 7
        
        current_date = today + timedelta(days=days_ahead)
        
        # Create bookings for each week
        while current_date <= end_date:
            # Check if booking already exists
            start_datetime = datetime.combine(current_date, schedule.start_time)
            end_datetime = datetime.combine(current_date, schedule.end_time)
            
            existing_booking = Booking.query.filter_by(
                customer_id=schedule.customer_id,
                coach_id=schedule.coach_id,
                start_time=start_datetime
            ).first()
            
            if not existing_booking:
                # Determine status based on available credits
                if subscription.credits_remaining > 0 or subscription.package.is_unlimited:
                    status = 'confirmed'
                else:
                    status = 'pending'
                
                # Create booking
                booking = Booking(
                    id=str(uuid.uuid4()),
                    customer_id=schedule.customer_id,
                    coach_id=schedule.coach_id,
                    start_time=start_datetime,
                    end_time=end_datetime,
                    status=status,
                    event_type='customer_session',
                    package_subscription_id=subscription.id,
                    recurring_schedule_id=schedule.id
                )
                
                db.session.add(booking)
                
                # Deduct credit if confirmed
                if status == 'confirmed' and not subscription.package.is_unlimited:
                    subscription.credits_used += 1
                    subscription.credits_remaining -= 1
            
            # Move to next week
            current_date += timedelta(weeks=1)
        
        db.session.commit()
        
    except Exception as e:
        db.session.rollback()
        print(f"Error creating bookings from schedule: {str(e)}")


@package_bp.route('/auto-book', methods=['POST'])
@token_required
@coach_required
def trigger_auto_booking(current_user):
    """Manually trigger auto-booking for all active recurring schedules"""
    try:
        coach_profile = current_user.coach_profile
        if not coach_profile:
            return jsonify({'message': 'Coach profile not found'}), 404
        
        schedules = RecurringSchedule.query.filter_by(
            coach_id=coach_profile.id,
            is_active=True,
            auto_book_enabled=True
        ).all()
        
        bookings_created = 0
        for schedule in schedules:
            create_bookings_from_schedule(schedule)
            bookings_created += 1
        
        return jsonify({
            'message': f'Auto-booking triggered for {bookings_created} schedules'
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to trigger auto-booking: {str(e)}'}), 500


# ============================================================================
# CREDIT CONVERSION (Pending → Confirmed)
# ============================================================================

@package_bp.route('/convert-pending-bookings', methods='POST'])
@token_required
@coach_required
def convert_pending_bookings(current_user):
    """Convert pending bookings to confirmed when credits become available"""
    try:
        coach_profile = current_user.coach_profile
        if not coach_profile:
            return jsonify({'message': 'Coach profile not found'}), 404
        
        data = request.json
        customer_id = data.get('customer_id')
        
        if not customer_id:
            return jsonify({'message': 'customer_id is required'}), 400
        
        # Get active subscription for customer
        subscription = PackageSubscription.query.filter_by(
            customer_id=customer_id,
            coach_id=coach_profile.id,
            status='active'
        ).first()
        
        if not subscription:
            return jsonify({'message': 'No active subscription found'}), 404
        
        # Get pending bookings
        pending_bookings = Booking.query.filter_by(
            customer_id=customer_id,
            coach_id=coach_profile.id,
            status='pending'
        ).order_by(Booking.start_time).all()
        
        converted_count = 0
        for booking in pending_bookings:
            if subscription.credits_remaining > 0 or subscription.package.is_unlimited:
                booking.status = 'confirmed'
                
                if not subscription.package.is_unlimited:
                    subscription.credits_used += 1
                    subscription.credits_remaining -= 1
                
                converted_count += 1
            else:
                break  # No more credits available
        
        db.session.commit()
        
        return jsonify({
            'message': f'{converted_count} pending bookings converted to confirmed',
            'converted_count': converted_count
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to convert pending bookings: {str(e)}'}), 500
