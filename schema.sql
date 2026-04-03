CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE document_type AS ENUM ('invoice', 'agreement');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE document_status AS ENUM ('draft', 'sent', 'signed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  logo_url TEXT,
  address TEXT,
  tax_id TEXT,
  bank_details TEXT,
  signature_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type document_type NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  total_amount NUMERIC(15, 2),
  status document_status DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doc_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  rate NUMERIC(15, 2),
  quantity NUMERIC(15, 2),
  total NUMERIC(15, 2) GENERATED ALWAYS AS (rate * quantity) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agreements_meta (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doc_id UUID REFERENCES documents(id) ON DELETE CASCADE UNIQUE,
  scope TEXT,
  timeline TEXT,
  revisions INTEGER,
  copyright_terms TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
