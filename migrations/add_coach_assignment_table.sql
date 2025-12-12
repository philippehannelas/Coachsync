-- Migration: Add coach_assignment table for temporary coach assignments
-- Date: 2025-12-12
-- Description: Allows coaches to temporarily assign substitute coaches to their clients

-- Create enum type for assignment status
DO $$ BEGIN
    CREATE TYPE assignment_status AS ENUM ('pending', 'active', 'completed', 'cancelled', 'declined');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create coach_assignment table
CREATE TABLE IF NOT EXISTS coach_assignment (
    id VARCHAR(36) PRIMARY KEY,
    customer_id VARCHAR(36) NOT NULL REFERENCES customer_profile(id) ON DELETE CASCADE,
    primary_coach_id VARCHAR(36) NOT NULL REFERENCES coach_profile(id) ON DELETE CASCADE,
    substitute_coach_id VARCHAR(36) NOT NULL REFERENCES coach_profile(id) ON DELETE CASCADE,
    
    -- Assignment period
    start_date DATE NOT NULL,
    end_date DATE,  -- NULL means indefinite
    
    -- Status
    status assignment_status DEFAULT 'pending',
    reason VARCHAR(255),
    
    -- Permissions for substitute coach
    can_view_history BOOLEAN DEFAULT TRUE,
    can_book_sessions BOOLEAN DEFAULT TRUE,
    can_edit_plans BOOLEAN DEFAULT FALSE,
    can_view_notes BOOLEAN DEFAULT TRUE,
    can_add_notes BOOLEAN DEFAULT TRUE,
    
    -- Audit trail
    created_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(36) REFERENCES "user"(id),
    accepted_at TIMESTAMP,
    declined_at TIMESTAMP,
    declined_reason TEXT,
    completed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    cancelled_by VARCHAR(36) REFERENCES "user"(id),
    cancellation_reason TEXT,
    
    -- Constraints
    CONSTRAINT check_dates CHECK (end_date IS NULL OR end_date >= start_date),
    CONSTRAINT check_different_coaches CHECK (primary_coach_id != substitute_coach_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_coach_assignment_customer ON coach_assignment(customer_id);
CREATE INDEX IF NOT EXISTS idx_coach_assignment_primary_coach ON coach_assignment(primary_coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_assignment_substitute_coach ON coach_assignment(substitute_coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_assignment_status ON coach_assignment(status);
CREATE INDEX IF NOT EXISTS idx_coach_assignment_dates ON coach_assignment(start_date, end_date);

-- Add comment to table
COMMENT ON TABLE coach_assignment IS 'Temporary coach assignments for vacation/sick coverage';
COMMENT ON COLUMN coach_assignment.status IS 'Assignment status: pending (awaiting acceptance), active (currently active), completed (ended), cancelled (cancelled by primary coach), declined (declined by substitute)';
COMMENT ON COLUMN coach_assignment.end_date IS 'NULL means indefinite assignment';
