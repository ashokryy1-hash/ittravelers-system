ALTER TABLE hms_leads
  ADD COLUMN IF NOT EXISTS priority text
    CHECK (priority IN ('hot', 'warm', 'cold', 'on_hold'));
