-- Add address fields to profiles table for CRM completeness
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address_street TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address_city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address_postal_code TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address_country TEXT DEFAULT 'France';
