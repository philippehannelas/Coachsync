-- Migration: Add coach_connections table for Coach Network system
-- Purpose: Enable coaches to build their professional network and manage connections
-- Date: 2025-12-12

-- Create coach_connections table
CREATE TABLE IF NOT EXISTS coach_connections (
    id SERIAL PRIMARY KEY,
    requester_coach_id INTEGER NOT NULL REFERENCES coach_profile(id) ON DELETE CASCADE,
    receiver_coach_id INTEGER NOT NULL REFERENCES coach_profile(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP,
    request_message TEXT,
    decline_reason TEXT,
    notes TEXT,  -- Private notes about this coach (only visible to requester)
    tags VARCHAR(255),  -- Comma-separated tags (e.g., "vacation-sub,nutrition,strength")
    
    -- Constraints
    CONSTRAINT check_different_coaches CHECK (requester_coach_id != receiver_coach_id),
    CONSTRAINT check_status CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
    CONSTRAINT unique_connection UNIQUE(requester_coach_id, receiver_coach_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_coach_connections_requester 
    ON coach_connections(requester_coach_id, status);

CREATE INDEX IF NOT EXISTS idx_coach_connections_receiver 
    ON coach_connections(receiver_coach_id, status);

CREATE INDEX IF NOT EXISTS idx_coach_connections_status 
    ON coach_connections(status);

-- Add columns to coach_assignment table for rating system
ALTER TABLE coach_assignment 
ADD COLUMN IF NOT EXISTS assignment_rating INTEGER CHECK (assignment_rating BETWEEN 1 AND 5);

ALTER TABLE coach_assignment 
ADD COLUMN IF NOT EXISTS assignment_feedback TEXT;

ALTER TABLE coach_assignment 
ADD COLUMN IF NOT EXISTS rated_at TIMESTAMP;

-- Create index for assignment ratings
CREATE INDEX IF NOT EXISTS idx_coach_assignment_rating 
    ON coach_assignment(substitute_coach_id, assignment_rating) 
    WHERE assignment_rating IS NOT NULL;

-- Comments for documentation
COMMENT ON TABLE coach_connections IS 'Manages professional connections between coaches for collaboration and substitute assignments';
COMMENT ON COLUMN coach_connections.status IS 'Connection status: pending (waiting for response), accepted (active connection), declined (rejected), blocked (prevented from connecting)';
COMMENT ON COLUMN coach_connections.notes IS 'Private notes visible only to the requester coach';
COMMENT ON COLUMN coach_connections.tags IS 'Comma-separated tags for categorizing connections';
COMMENT ON COLUMN coach_assignment.assignment_rating IS 'Rating (1-5 stars) given by primary coach after assignment completion';
COMMENT ON COLUMN coach_assignment.assignment_feedback IS 'Private feedback from primary coach about the assignment';
