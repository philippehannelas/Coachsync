-- db_migration_v2.sql
-- Schema changes for Admin and Access Management features

-- 1. Add columns to the 'users' table for account status and soft delete
ALTER TABLE users ADD COLUMN account_status VARCHAR(20) NOT NULL DEFAULT 'active';
ALTER TABLE users ADD COLUMN status_changed_at TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE users ADD COLUMN status_changed_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN status_reason TEXT;
ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP WITHOUT TIME ZONE;

-- 2. Add columns to the 'customer_profile' table for coach notes and archiving
ALTER TABLE customer_profile ADD COLUMN internal_notes TEXT;
ALTER TABLE customer_profile ADD COLUMN archived_at TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE customer_profile ADD COLUMN archived_by UUID REFERENCES users(id);

-- 3. Create the 'audit_log' table
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    actor_id UUID REFERENCES users(id), -- who performed the action (e.g., coach or admin)
    action VARCHAR(100) NOT NULL, -- e.g., 'user_status_changed', 'password_reset'
    entity_type VARCHAR(50), -- e.g., 'user', 'customer', 'training_plan'
    entity_id UUID,
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- 4. Create the 'password_reset_token' table
CREATE TABLE password_reset_token (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    used_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- 5. Backfill existing users to ensure 'active' status is set correctly
UPDATE users SET account_status = 'active' WHERE account_status IS NULL;

-- Note: The initial Admin user creation will be handled in the next phase
-- after the user runs this migration script.
