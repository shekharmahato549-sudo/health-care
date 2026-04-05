-- Healthcare App Database Schema
-- Run this migration in Supabase SQL Editor

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum types
CREATE TYPE user_role AS ENUM ('patient', 'doctor', 'admin', 'receptionist', 'nurse');
CREATE TYPE appointment_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');
CREATE TYPE appointment_type AS ENUM ('consultation', 'checkup', 'follow_up', 'procedure');
CREATE TYPE record_type AS ENUM ('consultation', 'lab', 'imaging', 'prescription', 'diagnosis', 'vital_signs');
CREATE TYPE notification_type AS ENUM ('email', 'sms', 'in_app');
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed');

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  profile_image_url TEXT,
  role user_role NOT NULL DEFAULT 'patient',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Patients table
CREATE TABLE patients (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  date_of_birth DATE,
  gender TEXT,
  blood_type TEXT,
  emergency_contact TEXT,
  emergency_contact_phone TEXT,
  allergies TEXT[] DEFAULT '{}',
  chronic_conditions TEXT[] DEFAULT '{}',
  medications TEXT[] DEFAULT '{}',
  insurance_provider TEXT,
  insurance_id TEXT,
  insurance_expiry DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Clinics table
CREATE TABLE clinics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  phone TEXT,
  email TEXT,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Doctors table
CREATE TABLE doctors (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  specialization TEXT NOT NULL,
  license_number TEXT NOT NULL UNIQUE,
  clinic_id UUID REFERENCES clinics(id),
  availability JSONB DEFAULT '{"monday": [], "tuesday": [], "wednesday": [], "thursday": [], "friday": [], "saturday": [], "sunday": []}',
  bio TEXT,
  consultation_fee DECIMAL(10, 2),
  rating FLOAT DEFAULT 0,
  total_patients INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Appointments table
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  appointment_type appointment_type DEFAULT 'consultation',
  status appointment_status DEFAULT 'scheduled',
  reason TEXT,
  notes TEXT,
  cancellation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Health Records table
CREATE TABLE health_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  record_type record_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  document_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Symptoms Checklist table (AI Symptom Checker history)
CREATE TABLE symptoms_checklist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  symptoms TEXT[] NOT NULL DEFAULT '{}',
  ai_analysis JSONB,
  suggested_conditions TEXT[] DEFAULT '{}',
  confidence_scores JSONB DEFAULT '{}',
  severity TEXT,
  recommendations TEXT,
  doctor_recommendation_id UUID REFERENCES appointments(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type notification_type NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  related_entity TEXT,
  related_id UUID,
  status notification_status DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_scheduled_date ON appointments(scheduled_date);
CREATE INDEX idx_health_records_patient ON health_records(patient_id);
CREATE INDEX idx_health_records_type ON health_records(record_type);
CREATE INDEX idx_symptoms_patient ON symptoms_checklist(patient_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptoms_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;

-- Users RLS policies
CREATE POLICY "Users can view their own profile" 
  ON users FOR SELECT USING (auth.uid() = auth_id);

CREATE POLICY "Admins can view all users" 
  ON users FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "Users can update their own profile" 
  ON users FOR UPDATE USING (auth.uid() = auth_id);

-- Patients RLS policies
CREATE POLICY "Patients can view their own record" 
  ON patients FOR SELECT USING (
    id = (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Doctors can view their patients" 
  ON patients FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM appointments a 
      WHERE a.patient_id = patients.id 
      AND a.doctor_id = (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY "Admins can view all patients" 
  ON patients FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role = 'admin')
  );

-- Doctors RLS policies
CREATE POLICY "Anyone can view doctor profiles" 
  ON doctors FOR SELECT USING (true);

CREATE POLICY "Doctors can update their own profile" 
  ON doctors FOR UPDATE USING (
    id = (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- Appointments RLS policies
CREATE POLICY "Patients can view their appointments" 
  ON appointments FOR SELECT USING (
    patient_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Doctors can view their appointments" 
  ON appointments FOR SELECT USING (
    doctor_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Admins can view all appointments" 
  ON appointments FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "Patients can create appointments" 
  ON appointments FOR INSERT WITH CHECK (
    patient_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Patients and doctors can update appointments" 
  ON appointments FOR UPDATE USING (
    patient_id = (SELECT id FROM users WHERE auth_id = auth.uid()) 
    OR doctor_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- Health Records RLS policies
CREATE POLICY "Patients can view their health records" 
  ON health_records FOR SELECT USING (
    patient_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Doctors can view their patients' records" 
  ON health_records FOR SELECT USING (
    patient_id IN (
      SELECT patient_id FROM appointments 
      WHERE doctor_id = (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY "Admins can view all health records" 
  ON health_records FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "Doctors and nurses can create records" 
  ON health_records FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.auth_id = auth.uid() AND u.role IN ('doctor', 'nurse', 'admin'))
  );

-- Symptoms Checklist RLS policies
CREATE POLICY "Patients can view their symptom history" 
  ON symptoms_checklist FOR SELECT USING (
    patient_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Doctors can view their patients' symptoms" 
  ON symptoms_checklist FOR SELECT USING (
    patient_id IN (
      SELECT patient_id FROM appointments 
      WHERE doctor_id = (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY "Patients can create symptom checks" 
  ON symptoms_checklist FOR INSERT WITH CHECK (
    patient_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- Notifications RLS policies
CREATE POLICY "Users can view their notifications" 
  ON notifications FOR SELECT USING (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "System can create notifications" 
  ON notifications FOR INSERT WITH CHECK (true);

-- Clinics RLS policies
CREATE POLICY "Anyone can view clinics" 
  ON clinics FOR SELECT USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_records_updated_at BEFORE UPDATE ON health_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_symptoms_checklist_updated_at BEFORE UPDATE ON symptoms_checklist
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
