-- Clinician-authored plan templates, and a review flag on plan items that came from a structure template.
CREATE TABLE IF NOT EXISTS plan_templates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name        text NOT NULL,
  description text NOT NULL DEFAULT '',
  specialty   text NOT NULL,
  horizon_days int NOT NULL DEFAULT 84,
  body        jsonb NOT NULL,
  based_on    text,
  created_by  uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS plan_templates_org_idx ON plan_templates (org_id);
ALTER TABLE plan_items ADD COLUMN IF NOT EXISTS needs_review boolean NOT NULL DEFAULT false;
