-- loci care: core schema
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  display_name text NOT NULL,
  password_hash text,
  timezone text NOT NULL DEFAULT 'America/New_York',
  role_pref text NOT NULL DEFAULT 'caregiver' CHECK (role_pref IN ('patient', 'caregiver', 'clinician')),
  current_journey_id uuid,
  is_demo boolean NOT NULL DEFAULT false,
  demo_expires_at timestamptz,
  onboarded_at timestamptz,
  tour_completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_email_lower ON users (lower(email)) WHERE email IS NOT NULL;
CREATE INDEX users_demo_expiry ON users (demo_expires_at) WHERE is_demo;

CREATE TABLE sessions (
  id text PRIMARY KEY, -- sha256 of the cookie token
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);
CREATE INDEX sessions_user ON sessions (user_id);

-- care teams: clinics, home-care agencies, hospitals, employers and insurers
CREATE TABLE orgs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('clinic', 'home_care', 'hospital', 'employer', 'other')),
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invite_code text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE org_members (
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'clinician')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, user_id)
);
CREATE INDEX org_members_user ON org_members (user_id);

CREATE TABLE journeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  org_id uuid REFERENCES orgs(id) ON DELETE SET NULL,
  person_name text NOT NULL,
  led_by text NOT NULL CHECK (led_by IN ('patient', 'caregiver')),
  specialty text NOT NULL,
  discharge_date date NOT NULL,
  horizon_days integer NOT NULL CHECK (horizon_days BETWEEN 7 AND 365),
  timezone text NOT NULL DEFAULT 'America/New_York',
  city jsonb,
  plan_source text NOT NULL DEFAULT 'family' CHECK (plan_source IN ('clinician', 'family', 'patient')),
  plan_entered_by text NOT NULL DEFAULT '',
  care_team_name text NOT NULL DEFAULT '',
  care_team_phone text NOT NULL DEFAULT '',
  emergency_number text NOT NULL DEFAULT '911',
  diet_notes text NOT NULL DEFAULT '',
  consent_org boolean NOT NULL DEFAULT false,
  consent_org_at timestamptz,
  share_slug text UNIQUE,
  card jsonb NOT NULL DEFAULT '{}',
  thriving_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX journeys_org ON journeys (org_id);

ALTER TABLE users ADD CONSTRAINT users_current_journey FOREIGN KEY (current_journey_id) REFERENCES journeys(id) ON DELETE SET NULL;

CREATE TABLE circle_members (
  journey_id uuid NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('patient', 'caregiver', 'family', 'carer', 'clinician')),
  is_owner boolean NOT NULL DEFAULT false,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (journey_id, user_id)
);
CREATE INDEX circle_members_user ON circle_members (user_id);

CREATE TABLE invites (
  code text PRIMARY KEY,
  journey_id uuid REFERENCES journeys(id) ON DELETE CASCADE,
  org_id uuid REFERENCES orgs(id) ON DELETE CASCADE,
  role text NOT NULL,
  created_by uuid REFERENCES users(id) ON DELETE CASCADE,
  uses integer NOT NULL DEFAULT 0,
  max_uses integer NOT NULL DEFAULT 10,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (journey_id IS NOT NULL OR org_id IS NOT NULL)
);

-- the discharge plan, entered by a clinician or the family. Nothing here is generated.
CREATE TABLE plan_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id uuid NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('medication', 'care', 'exercise', 'appointment', 'milestone')),
  title text NOT NULL,
  detail text NOT NULL DEFAULT '',
  times text[] NOT NULL DEFAULT '{}',
  weekdays smallint[],
  start_day integer NOT NULL DEFAULT 0,
  end_day integer,
  day integer,
  at_time text,
  location text NOT NULL DEFAULT '',
  sort integer NOT NULL DEFAULT 0,
  reached_at timestamptz,
  reached_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX plan_items_journey ON plan_items (journey_id, kind, sort);

CREATE TABLE warning_signs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id uuid NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  text text NOT NULL,
  action text NOT NULL CHECK (action IN ('call_team', 'emergency')),
  sort integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX warning_signs_journey ON warning_signs (journey_id);

CREATE TABLE thresholds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id uuid NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  metric text NOT NULL CHECK (metric IN ('mood', 'pain', 'sleep', 'appetite', 'energy')),
  op text NOT NULL CHECK (op IN ('gte', 'lte')),
  value smallint NOT NULL,
  days smallint NOT NULL DEFAULT 1 CHECK (days BETWEEN 1 AND 7),
  action text NOT NULL CHECK (action IN ('call_team', 'emergency')),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE task_logs (
  item_id uuid NOT NULL REFERENCES plan_items(id) ON DELETE CASCADE,
  journey_id uuid NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  for_date date NOT NULL,
  slot text NOT NULL DEFAULT 'any',
  done_by uuid REFERENCES users(id) ON DELETE SET NULL,
  done_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (item_id, for_date, slot)
);
CREATE INDEX task_logs_journey_date ON task_logs (journey_id, for_date);

CREATE TABLE checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id uuid NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  for_date date NOT NULL,
  by_user uuid REFERENCES users(id) ON DELETE SET NULL,
  mood smallint NOT NULL CHECK (mood BETWEEN 1 AND 5),
  pain smallint NOT NULL CHECK (pain BETWEEN 0 AND 10),
  sleep smallint NOT NULL CHECK (sleep BETWEEN 1 AND 5),
  appetite smallint NOT NULL CHECK (appetite BETWEEN 1 AND 5),
  energy smallint NOT NULL CHECK (energy BETWEEN 1 AND 5),
  signs uuid[] NOT NULL DEFAULT '{}',
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (journey_id, for_date)
);

CREATE TABLE flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id uuid NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  checkin_id uuid REFERENCES checkins(id) ON DELETE CASCADE,
  source text NOT NULL CHECK (source IN ('threshold', 'warning_sign')),
  ref_id uuid,
  action text NOT NULL CHECK (action IN ('call_team', 'emergency')),
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  ack_by uuid REFERENCES users(id) ON DELETE SET NULL,
  ack_at timestamptz,
  ack_note text NOT NULL DEFAULT ''
);
CREATE INDEX flags_journey ON flags (journey_id, created_at DESC);

CREATE TABLE circle_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id uuid NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  title text NOT NULL,
  due_date date,
  assignee uuid REFERENCES users(id) ON DELETE SET NULL,
  done_at timestamptz,
  done_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX circle_tasks_journey ON circle_tasks (journey_id);

CREATE TABLE activity (
  id bigserial PRIMARY KEY,
  journey_id uuid NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  kind text NOT NULL,
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX activity_journey ON activity (journey_id, created_at DESC);

-- comfort preferences: what the person loves, plus filters the person or clinician ticked
CREATE TABLE taste (
  journey_id uuid PRIMARY KEY REFERENCES journeys(id) ON DELETE CASCADE,
  favorites jsonb NOT NULL DEFAULT '[]',
  filters text[] NOT NULL DEFAULT '{}',
  outings_ok boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE consent_log (
  id bigserial PRIMARY KEY,
  journey_id uuid REFERENCES journeys(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  scope text NOT NULL CHECK (scope IN ('circle', 'org', 'share')),
  granted boolean NOT NULL,
  detail text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- private server-side cache of Qloo responses (never exported, never committed)
CREATE TABLE qloo_cache (
  key text PRIMARY KEY,
  status integer NOT NULL,
  body jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);
