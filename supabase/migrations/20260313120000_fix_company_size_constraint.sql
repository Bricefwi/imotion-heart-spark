-- Fix company_size CHECK constraint to match onboarding form values
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_company_size_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_company_size_check
  CHECK (company_size IN ('solo', '1 personne', '2-10', '11-50', '51-200', '201-500', '200+', '500+'));

-- Normalize any old 'solo' values to '1 personne'
UPDATE profiles SET company_size = '1 personne' WHERE company_size = 'solo';
-- Normalize any old '500+' or '201-500' values to '200+'
UPDATE profiles SET company_size = '200+' WHERE company_size IN ('500+', '201-500');
