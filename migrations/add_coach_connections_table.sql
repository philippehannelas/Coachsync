-- Migration: Add coach_connections table for coach network system
-- This enables coaches to build professional networks and manage substitute assignments

-- Create coach_connections table
CREATE TABLE IF NOT EXISTS coach_connections (
    id SERIAL PRIMARY KEY,
    requester_coach_id VARCHAR(36) NOT NULL,  -- FIXED: Changed from INTEGER to VARCHAR(36)
    receiver_coach_id VARCHAR(36) NOT NULL,   -- FIXED: Changed from INTEGER to VARCHAR(36)
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP,
    request_message TEXT,
    decline_reason TEXT,
    notes TEXT,  -- Private notes (only visible to requester)
    tags VARCHAR(255),  -- Comma-separated tags
    
    -- Foreign keys
    FOREIGN KEY (requester_coach_id) REFERENCES coach_profile(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_coach_id) REFERENCES coach_profile(id) ON DELETE CASCADE,
    
    -- Constraints
    CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
    CHECK (requester_coach_id != receiver_coach_id),  -- Prevent self-connections
    UNIQUE (requester_coach_id, receiver_coach_id)  -- Prevent duplicate connections
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_coach_connections_requester ON coach_connections(requester_coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_connections_receiver ON coach_connections(receiver_coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_connections_status ON coach_connections(status);
CREATE INDEX IF NOT EXISTS idx_coach_connections_requested_at ON coach_connections(requested_at);

-- Add rating columns to coach_assignment table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='coach_assignment' AND column_name='assignment_rating') THEN
        ALTER TABLE coach_assignment ADD COLUMN assignment_rating INTEGER CHECK (assignment_rating >= 1 AND assignment_rating <= 5);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='coach_assignment' AND column_name='assignment_feedback') THEN
        ALTER TABLE coach_assignment ADD COLUMN assignment_feedback TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='coach_assignment' AND column_name='rated_at') THEN
        ALTER TABLE coach_assignment ADD COLUMN rated_at TIMESTAMP;
    END IF;
END $$;
