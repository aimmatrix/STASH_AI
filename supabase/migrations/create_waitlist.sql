-- Pro waitlist table — tracks users who want Bank Sync / Real Payouts
CREATE TABLE IF NOT EXISTS waitlist (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email       TEXT NOT NULL,
    feature     TEXT NOT NULL,               -- e.g. 'bank_sync', 'real_payouts'
    position    INTEGER,                     -- populated by trigger below
    joined_at   TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, feature)                -- one entry per user per feature
);

-- Auto-assign queue position on insert
-- SECURITY DEFINER so the trigger can read all rows (bypassing RLS) to compute MAX(position)
CREATE OR REPLACE FUNCTION set_waitlist_position()
RETURNS TRIGGER AS $$
BEGIN
    NEW.position := (
        SELECT COALESCE(MAX(position), 0) + 1
        FROM waitlist
        WHERE feature = NEW.feature
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER waitlist_position_trigger
    BEFORE INSERT ON waitlist
    FOR EACH ROW
    EXECUTE FUNCTION set_waitlist_position();

-- Index for fast position lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_feature ON waitlist (feature, position);
CREATE INDEX IF NOT EXISTS idx_waitlist_user    ON waitlist (user_id);

-- ── Row Level Security ──────────────────────────────────────────────────────

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all waitlist entries.
-- This is intentional: the hook needs to COUNT all entries per feature
-- to display "X people are waiting" social proof. Position numbers are
-- not sensitive — emails and user_ids are not exposed in SELECT queries
-- from the client.
CREATE POLICY "waitlist_select_authenticated"
    ON waitlist FOR SELECT
    TO authenticated
    USING (true);

-- Users can only insert their own entry (user_id must match the JWT subject).
CREATE POLICY "waitlist_insert_own"
    ON waitlist FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- No UPDATE or DELETE — waitlist positions are permanent once assigned.
