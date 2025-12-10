-- Migration: Add Package and Recurring Schedule System
-- Date: 2025-01-10
-- Description: Adds customizable packages, subscriptions, and recurring schedules

-- Create enum types
CREATE TYPE period_type AS ENUM ('weekly', 'monthly', 'quarterly', 'yearly', 'one_time');
CREATE TYPE subscription_status AS ENUM ('active', 'paused', 'cancelled', 'expired');

-- Update booking_status enum to ensure it has pending
-- (It already exists, but this ensures pending is included)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
        CREATE TYPE booking_status AS ENUM ('confirmed', 'pending', 'cancelled');
    END IF;
END $$;

-- Create Package table
CREATE TABLE IF NOT EXISTS package (
    id VARCHAR(36) PRIMARY KEY,
    coach_id VARCHAR(36) NOT NULL REFERENCES coach_profile(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    credits_per_period INTEGER NOT NULL,
    is_unlimited BOOLEAN DEFAULT FALSE,
    price NUMERIC(10, 2),
    currency VARCHAR(3) DEFAULT 'USD',
    period_type period_type DEFAULT 'monthly',
    auto_renew BOOLEAN DEFAULT TRUE,
    valid_days JSON,
    valid_start_time TIME,
    valid_end_time TIME,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create PackageSubscription table
CREATE TABLE IF NOT EXISTS package_subscription (
    id VARCHAR(36) PRIMARY KEY,
    package_id VARCHAR(36) NOT NULL REFERENCES package(id) ON DELETE CASCADE,
    customer_id VARCHAR(36) NOT NULL REFERENCES customer_profile(id) ON DELETE CASCADE,
    coach_id VARCHAR(36) NOT NULL REFERENCES coach_profile(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE,
    next_renewal_date DATE,
    credits_allocated INTEGER DEFAULT 0,
    credits_used INTEGER DEFAULT 0,
    credits_remaining INTEGER DEFAULT 0,
    status subscription_status DEFAULT 'active',
    auto_renew BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT
);

-- Create RecurringSchedule table
CREATE TABLE IF NOT EXISTS recurring_schedule (
    id VARCHAR(36) PRIMARY KEY,
    subscription_id VARCHAR(36) NOT NULL REFERENCES package_subscription(id) ON DELETE CASCADE,
    customer_id VARCHAR(36) NOT NULL REFERENCES customer_profile(id) ON DELETE CASCADE,
    coach_id VARCHAR(36) NOT NULL REFERENCES coach_profile(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    auto_book_enabled BOOLEAN DEFAULT TRUE,
    book_weeks_ahead INTEGER DEFAULT 4,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paused_at TIMESTAMP,
    paused_until DATE
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_package_coach_id ON package(coach_id);
CREATE INDEX IF NOT EXISTS idx_package_subscription_customer_id ON package_subscription(customer_id);
CREATE INDEX IF NOT EXISTS idx_package_subscription_coach_id ON package_subscription(coach_id);
CREATE INDEX IF NOT EXISTS idx_package_subscription_status ON package_subscription(status);
CREATE INDEX IF NOT EXISTS idx_recurring_schedule_customer_id ON recurring_schedule(customer_id);
CREATE INDEX IF NOT EXISTS idx_recurring_schedule_coach_id ON recurring_schedule(coach_id);
CREATE INDEX IF NOT EXISTS idx_recurring_schedule_day_of_week ON recurring_schedule(day_of_week);

-- Add package_subscription_id to booking table (optional, for tracking)
ALTER TABLE booking ADD COLUMN IF NOT EXISTS package_subscription_id VARCHAR(36) REFERENCES package_subscription(id) ON DELETE SET NULL;
ALTER TABLE booking ADD COLUMN IF NOT EXISTS recurring_schedule_id VARCHAR(36) REFERENCES recurring_schedule(id) ON DELETE SET NULL;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_package_updated_at BEFORE UPDATE ON package
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_package_subscription_updated_at BEFORE UPDATE ON package_subscription
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recurring_schedule_updated_at BEFORE UPDATE ON recurring_schedule
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE package IS 'Customizable subscription packages created by coaches';
COMMENT ON TABLE package_subscription IS 'Customer subscriptions to packages with credit tracking';
COMMENT ON TABLE recurring_schedule IS 'Recurring booking templates for package subscribers';
COMMENT ON COLUMN package.valid_days IS 'JSON array of valid day indices [0-6], null means all days';
COMMENT ON COLUMN package.is_unlimited IS 'If true, customer gets unlimited sessions per period';
COMMENT ON COLUMN package_subscription.credits_remaining IS 'Calculated field: credits_allocated - credits_used';
COMMENT ON COLUMN recurring_schedule.book_weeks_ahead IS 'How many weeks in advance to auto-create bookings';
