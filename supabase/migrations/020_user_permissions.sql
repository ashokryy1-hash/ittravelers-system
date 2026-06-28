CREATE TABLE hms_user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  allowed_modules text[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE hms_user_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_permissions" ON hms_user_permissions FOR ALL USING (auth.role() = 'authenticated');
