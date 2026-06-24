CREATE TABLE hms_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  wedding_date date,
  pax integer DEFAULT 2,
  destination text DEFAULT 'Bali',
  source text DEFAULT 'Marketing',
  status text NOT NULL DEFAULT 'New'
    CHECK (status IN ('New', 'Contacted', 'Replied', 'Meeting', 'Proposal Sent', 'Booked', 'Lost')),
  notes text,
  whatsapp_sent boolean DEFAULT false,
  whatsapp_sent_at timestamptz,
  meeting_type text CHECK (meeting_type IN ('Office', 'Google Meet', NULL)),
  meeting_date timestamptz,
  assigned_to text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE hms_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_leads" ON hms_leads FOR ALL USING (auth.role() = 'authenticated');

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_hms_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hms_leads_updated_at
  BEFORE UPDATE ON hms_leads
  FOR EACH ROW EXECUTE FUNCTION update_hms_leads_updated_at();
