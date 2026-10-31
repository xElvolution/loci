-- Reminders: per person and journey preferences, and a delivery log that records only real provider results.
CREATE TABLE IF NOT EXISTS reminder_prefs (
  user_id        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  journey_id     uuid NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  checkin_time   text,                       -- HH:MM in the journey's time zone, NULL = no check-in reminder
  steps          boolean NOT NULL DEFAULT false,  -- remind at the times of today's plan steps (in app)
  in_app         boolean NOT NULL DEFAULT true,
  sms            boolean NOT NULL DEFAULT false,
  whatsapp       boolean NOT NULL DEFAULT false,
  phone          text,                       -- E.164, only kept while SMS or WhatsApp is on
  updated_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, journey_id)
);

CREATE TABLE IF NOT EXISTS reminder_deliveries (
  id           bigserial PRIMARY KEY,
  user_id      uuid REFERENCES users(id) ON DELETE CASCADE,
  journey_id   uuid REFERENCES journeys(id) ON DELETE CASCADE,
  channel      text NOT NULL CHECK (channel IN ('sms', 'whatsapp')),
  kind         text NOT NULL CHECK (kind IN ('checkin', 'test')),
  for_date     date NOT NULL,
  status       text NOT NULL CHECK (status IN ('sent', 'failed')),
  provider     text NOT NULL,
  provider_id  text,
  error        text,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS reminder_deliveries_once ON reminder_deliveries (user_id, journey_id, channel, kind, for_date) WHERE kind = 'checkin' AND status = 'sent';
