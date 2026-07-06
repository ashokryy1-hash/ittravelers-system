CREATE TABLE IF NOT EXISTS hms_inbox_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  received_at timestamptz NOT NULL DEFAULT now(),
  from_address text,
  subject text,
  body text NOT NULL,
  extracted_data jsonb,
  status text NOT NULL DEFAULT 'unreviewed', -- unreviewed | saved_reservation | saved_tour | ignored
  linked_booking_id uuid REFERENCES hms_bookings(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE hms_inbox_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage inbox emails"
  ON hms_inbox_emails FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
