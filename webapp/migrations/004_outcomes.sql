-- Outcome tracking: clinician-chosen instruments per patient, the values they enter, and readmissions.
CREATE TABLE IF NOT EXISTS outcome_measures (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id       uuid NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  instrument       text NOT NULL,
  label            text NOT NULL,
  unit             text NOT NULL DEFAULT '',
  min_value        numeric NOT NULL,
  max_value        numeric NOT NULL,
  higher_is_better boolean NOT NULL DEFAULT true,
  target           numeric,
  created_by       uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS outcome_measures_journey_idx ON outcome_measures (journey_id);

CREATE TABLE IF NOT EXISTS outcome_values (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  measure_id  uuid NOT NULL REFERENCES outcome_measures(id) ON DELETE CASCADE,
  journey_id  uuid NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  value       numeric NOT NULL,
  measured_on date NOT NULL,
  note        text NOT NULL DEFAULT '',
  by_user     uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS outcome_values_measure_idx ON outcome_values (measure_id, measured_on);

CREATE TABLE IF NOT EXISTS readmissions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id     uuid NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  admitted_on    date NOT NULL,
  discharged_on  date,
  note           text NOT NULL DEFAULT '',
  by_user        uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS readmissions_journey_idx ON readmissions (journey_id);
