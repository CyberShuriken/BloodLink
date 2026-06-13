CREATE TYPE blood_type AS ENUM ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');
CREATE TYPE user_role AS ENUM ('donor', 'patient', 'hospital_staff', 'blood_bank_admin', 'admin');
CREATE TYPE request_status AS ENUM ('open', 'partially_fulfilled', 'fulfilled', 'cancelled', 'expired');
CREATE TYPE response_status AS ENUM ('pending', 'accepted', 'rejected', 'completed', 'no_show');
CREATE TYPE urgency_level AS ENUM ('critical', 'urgent', 'normal');

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  role user_role NOT NULL DEFAULT 'donor',
  student_id TEXT,
  department TEXT,
  batch TEXT,
  contact_number TEXT,
  blood_type blood_type,
  present_address TEXT,
  present_district TEXT,
  present_division TEXT,
  permanent_address TEXT,
  permanent_district TEXT,
  permanent_division TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_eligible BOOLEAN DEFAULT TRUE,
  last_donation_date DATE,
  total_donations INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  avatar_url TEXT,
  bio TEXT,
  is_profile_complete BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE blood_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  blood_type blood_type NOT NULL,
  units_needed INTEGER NOT NULL DEFAULT 1,
  units_fulfilled INTEGER NOT NULL DEFAULT 0,
  urgency urgency_level NOT NULL DEFAULT 'urgent',
  status request_status NOT NULL DEFAULT 'open',
  hospital_name TEXT NOT NULL,
  hospital_address TEXT NOT NULL,
  district TEXT NOT NULL,
  division TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  contact_number TEXT NOT NULL,
  description TEXT,
  needed_before TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

CREATE TABLE donor_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES blood_requests(id) ON DELETE CASCADE,
  donor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status response_status NOT NULL DEFAULT 'pending',
  message TEXT,
  responded_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(request_id, donor_id)
);

CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  request_id UUID REFERENCES blood_requests(id) ON DELETE SET NULL,
  response_id UUID REFERENCES donor_responses(id) ON DELETE SET NULL,
  hospital_name TEXT NOT NULL,
  blood_type blood_type NOT NULL,
  units_donated INTEGER NOT NULL DEFAULT 1,
  donated_at DATE NOT NULL DEFAULT CURRENT_DATE,
  certificate_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('emergency', 'response', 'system', 'reminder')),
  is_read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE blood_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  managed_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  institution_name TEXT NOT NULL,
  blood_type blood_type NOT NULL,
  units_available INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(managed_by, blood_type)
);

CREATE INDEX idx_profiles_blood_type ON profiles(blood_type);
CREATE INDEX idx_profiles_district ON profiles(present_district);
CREATE INDEX idx_profiles_division ON profiles(present_division);
CREATE INDEX idx_profiles_eligible ON profiles(is_eligible, is_available);
CREATE INDEX idx_blood_requests_status ON blood_requests(status);
CREATE INDEX idx_blood_requests_blood_type ON blood_requests(blood_type);
CREATE INDEX idx_blood_requests_district ON blood_requests(district);
CREATE INDEX idx_donor_responses_donor ON donor_responses(donor_id);
CREATE INDEX idx_donor_responses_request ON donor_responses(request_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_blood_requests_updated_at
  BEFORE UPDATE ON blood_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'donor'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Mark donor ineligible after confirmed donation
CREATE OR REPLACE FUNCTION handle_donation_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE profiles SET
      last_donation_date = CURRENT_DATE,
      is_eligible = FALSE,
      total_donations = total_donations + 1
    WHERE id = NEW.donor_id;

    INSERT INTO donations (donor_id, request_id, response_id, hospital_name, blood_type, units_donated, donated_at)
    SELECT NEW.donor_id, br.id, NEW.id, br.hospital_name, br.blood_type, 1, CURRENT_DATE
    FROM blood_requests br WHERE br.id = NEW.request_id;

    UPDATE blood_requests SET units_fulfilled = units_fulfilled + 1
    WHERE id = NEW.request_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_donor_response_completed
  AFTER UPDATE ON donor_responses
  FOR EACH ROW EXECUTE FUNCTION handle_donation_completed();

-- Restore eligibility after 90 days (run via pg_cron daily)
CREATE OR REPLACE FUNCTION restore_donor_eligibility()
RETURNS void AS $$
BEGIN
  UPDATE profiles SET is_eligible = TRUE
  WHERE is_eligible = FALSE
    AND last_donation_date IS NOT NULL
    AND last_donation_date <= CURRENT_DATE - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE donor_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_inventory ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Profiles are publicly readable" ON profiles FOR SELECT USING (TRUE);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Blood requests
CREATE POLICY "Blood requests are public" ON blood_requests FOR SELECT USING (TRUE);
CREATE POLICY "Authenticated users can create requests" ON blood_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Owners can update own requests" ON blood_requests
  FOR UPDATE USING (auth.uid() = requester_id);

-- Donor responses
CREATE POLICY "Donors can see their responses" ON donor_responses
  FOR SELECT USING (
    auth.uid() = donor_id OR
    auth.uid() = (SELECT requester_id FROM blood_requests WHERE id = request_id)
  );
CREATE POLICY "Donors can create responses" ON donor_responses
  FOR INSERT WITH CHECK (auth.uid() = donor_id);
CREATE POLICY "Donors can update own responses" ON donor_responses
  FOR UPDATE USING (auth.uid() = donor_id);

-- Donations
CREATE POLICY "Donors can see own donations" ON donations
  FOR SELECT USING (auth.uid() = donor_id);

-- Notifications
CREATE POLICY "Users see own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Inventory
CREATE POLICY "Inventory is public" ON blood_inventory FOR SELECT USING (TRUE);
CREATE POLICY "Managers can manage inventory" ON blood_inventory
  FOR ALL USING (auth.uid() = managed_by);

INSERT INTO storage.buckets (id, name, public) VALUES ('certificates', 'certificates', TRUE);
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', TRUE);

CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Auth users can upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "Anyone can view certificates"
  ON storage.objects FOR SELECT USING (bucket_id = 'certificates');
