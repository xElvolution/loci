-- Research layer: a separate, opt-in research consent per journey, and a log of every aggregate view or export.
ALTER TABLE journeys ADD COLUMN IF NOT EXISTS research_consent boolean NOT NULL DEFAULT false;
ALTER TABLE journeys ADD COLUMN IF NOT EXISTS research_consent_at timestamptz;

ALTER TABLE consent_log DROP CONSTRAINT IF EXISTS consent_log_scope_check;
ALTER TABLE consent_log ADD CONSTRAINT consent_log_scope_check CHECK (scope IN ('circle', 'org', 'share', 'research'));

CREATE TABLE IF NOT EXISTS research_access_log (
  id         bigserial PRIMARY KEY,
  org_id     uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES users(id) ON DELETE SET NULL,
  kind       text NOT NULL CHECK (kind IN ('view', 'export')),
  cohort     integer NOT NULL,
  cells_shown integer NOT NULL,
  cells_suppressed integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS research_access_log_org_idx ON research_access_log (org_id, created_at DESC);
