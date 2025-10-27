"""
Availability Helper Functions
Handles logic for checking coach availability with date-specific overrides
"""

from datetime import datetime, date, time
from src.models.user import Availability, DateSpecificAvailability

def check_coach_availability(coach_id, check_date, check_time):
    """
    Check if a coach is available at a specific date and time
    
    Priority:
    1. Date-specific availability (highest priority)
       - If date is blocked → NOT available
       - If date has override → Check override times
    2. Recurring weekly availability (fallback)
       - Check day_of_week schedule
    
    Args:
        coach_id: Coach profile ID
        check_date: Date object or datetime object
        check_time: Time object or string "HH:MM"
    
    Returns:
        dict: {
            'available': bool,
            'source': 'date_specific' | 'recurring' | 'none',
            'details': {...}
        }
    """
    
    # Convert inputs to proper types
    if isinstance(check_date, datetime):
        check_date = check_date.date()
    
    if isinstance(check_time, str):
        check_time = datetime.strptime(check_time, '%H:%M').time()
    
    # Step 1: Check date-specific availability (highest priority)
    date_specific = DateSpecificAvailability.query.filter_by(
        coach_id=coach_id,
        date=check_date
    ).first()
    
    if date_specific:
        if date_specific.type == 'blocked':
            # Date is blocked - not available
            return {
                'available': False,
                'source': 'date_specific',
                'details': {
                    'type': 'blocked',
                    'reason': date_specific.reason
                }
            }
        
        elif date_specific.type == 'override':
            # Check if time falls within override hours
            is_available = (
                check_time >= date_specific.start_time and 
                check_time < date_specific.end_time
            )
            return {
                'available': is_available,
                'source': 'date_specific',
                'details': {
                    'type': 'override',
                    'start_time': date_specific.start_time.strftime('%H:%M'),
                    'end_time': date_specific.end_time.strftime('%H:%M'),
                    'reason': date_specific.reason
                }
            }
    
    # Step 2: Check recurring weekly availability (fallback)
    # Convert date to day_of_week (0=Monday, 6=Sunday)
    day_of_week = check_date.weekday()  # Python weekday: 0=Monday, 6=Sunday
    
    recurring = Availability.query.filter_by(
        coach_id=coach_id,
        day_of_week=day_of_week,
        is_active=True
    ).all()
    
    if not recurring:
        # No recurring availability for this day
        return {
            'available': False,
            'source': 'none',
            'details': {
                'message': 'No availability set for this day'
            }
        }
    
    # Check if time falls within any recurring slot
    for slot in recurring:
        if check_time >= slot.start_time and check_time < slot.end_time:
            return {
                'available': True,
                'source': 'recurring',
                'details': {
                    'day_of_week': day_of_week,
                    'start_time': slot.start_time.strftime('%H:%M'),
                    'end_time': slot.end_time.strftime('%H:%M')
                }
            }
    
    # Time doesn't fall within any recurring slot
    return {
        'available': False,
        'source': 'recurring',
        'details': {
            'message': 'Time outside available hours'
        }
    }


def get_available_slots_for_date(coach_id, check_date, slot_duration=60):
    """
    Get all available time slots for a specific date
    
    Args:
        coach_id: Coach profile ID
        check_date: Date object
        slot_duration: Duration of each slot in minutes (default 60)
    
    Returns:
        list: List of available time slots as strings ["09:00", "10:00", ...]
    """
    
    # Convert to date if datetime
    if isinstance(check_date, datetime):
        check_date = check_date.date()
    
    # Step 1: Check date-specific availability
    date_specific = DateSpecificAvailability.query.filter_by(
        coach_id=coach_id,
        date=check_date
    ).first()
    
    if date_specific:
        if date_specific.type == 'blocked':
            # Date is blocked - no slots available
            return []
        
        elif date_specific.type == 'override':
            # Generate slots from override times
            return _generate_time_slots(
                date_specific.start_time,
                date_specific.end_time,
                slot_duration
            )
    
    # Step 2: Use recurring weekly availability
    day_of_week = check_date.weekday()
    
    recurring = Availability.query.filter_by(
        coach_id=coach_id,
        day_of_week=day_of_week,
        is_active=True
    ).all()
    
    if not recurring:
        return []
    
    # Generate slots from all recurring availability windows
    all_slots = []
    for slot in recurring:
        slots = _generate_time_slots(slot.start_time, slot.end_time, slot_duration)
        all_slots.extend(slots)
    
    # Remove duplicates and sort
    all_slots = sorted(list(set(all_slots)))
    
    return all_slots


def _generate_time_slots(start_time, end_time, duration_minutes):
    """
    Helper function to generate time slots between start and end time
    
    Args:
        start_time: Time object
        end_time: Time object
        duration_minutes: Duration of each slot in minutes
    
    Returns:
        list: List of time strings ["09:00", "10:00", ...]
    """
    slots = []
    
    # Convert times to minutes since midnight
    start_minutes = start_time.hour * 60 + start_time.minute
    end_minutes = end_time.hour * 60 + end_time.minute
    
    current_minutes = start_minutes
    
    while current_minutes + duration_minutes <= end_minutes:
        hours = current_minutes // 60
        minutes = current_minutes % 60
        time_str = f"{hours:02d}:{minutes:02d}"
        slots.append(time_str)
        current_minutes += duration_minutes
    
    return slots


def get_blocked_dates(coach_id, start_date=None, end_date=None):
    """
    Get all blocked dates for a coach within a date range
    
    Args:
        coach_id: Coach profile ID
        start_date: Start of date range (optional)
        end_date: End of date range (optional)
    
    Returns:
        list: List of blocked date objects
    """
    query = DateSpecificAvailability.query.filter_by(
        coach_id=coach_id,
        type='blocked'
    )
    
    if start_date:
        query = query.filter(DateSpecificAvailability.date >= start_date)
    
    if end_date:
        query = query.filter(DateSpecificAvailability.date <= end_date)
    
    blocked = query.all()
    
    return [item.date for item in blocked]


def get_override_dates(coach_id, start_date=None, end_date=None):
    """
    Get all override dates for a coach within a date range
    
    Args:
        coach_id: Coach profile ID
        start_date: Start of date range (optional)
        end_date: End of date range (optional)
    
    Returns:
        dict: {date: {'start_time': '09:00', 'end_time': '17:00', 'reason': '...'}}
    """
    query = DateSpecificAvailability.query.filter_by(
        coach_id=coach_id,
        type='override'
    )
    
    if start_date:
        query = query.filter(DateSpecificAvailability.date >= start_date)
    
    if end_date:
        query = query.filter(DateSpecificAvailability.date <= end_date)
    
    overrides = query.all()
    
    result = {}
    for item in overrides:
        result[item.date] = {
            'start_time': item.start_time.strftime('%H:%M'),
            'end_time': item.end_time.strftime('%H:%M'),
            'reason': item.reason
        }
    
    return result


