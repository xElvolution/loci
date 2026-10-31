-- Two-sided product: clinician-authored plans that are sent to patients,
-- step-by-step instructions, plan update notices and a care team message thread.

ALTER TABLE plan_items ADD COLUMN IF NOT EXISTS why text NOT NULL DEFAULT '';
ALTER TABLE plan_items ADD COLUMN IF NOT EXISTS how text NOT NULL DEFAULT '';

ALTER TABLE journeys ADD COLUMN IF NOT EXISTS plan_sent_at timestamptz;
ALTER TABLE journeys ADD COLUMN IF NOT EXISTS plan_updated_at timestamptz;
ALTER TABLE journeys ADD COLUMN IF NOT EXISTS instructions text NOT NULL DEFAULT '';

ALTER TABLE circle_members ADD COLUMN IF NOT EXISTS plan_seen_at timestamptz,
  ADD COLUMN IF NOT EXISTS ask_seen_at timestamptz;

ALTER TABLE users ADD COLUMN IF NOT EXISTS demo_pair uuid REFERENCES users(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id uuid NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  side text NOT NULL CHECK (side IN ('patient', 'team')),
  kind text NOT NULL DEFAULT 'message' CHECK (kind IN ('message', 'question', 'update')),
  body text NOT NULL CHECK (length(body) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS messages_journey ON messages (journey_id, created_at);
CREATE INDEX IF NOT EXISTS messages_open_questions ON messages (journey_id) WHERE kind = 'question' AND resolved_at IS NULL;

-- clinician-created plans already shared with the authoring team are marked sent
UPDATE journeys SET plan_sent_at = created_at WHERE plan_source = 'clinician' AND org_id IS NOT NULL AND plan_sent_at IS NULL;
