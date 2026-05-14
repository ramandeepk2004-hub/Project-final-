-- Storage buckets (input-audio, output-audio) must be created manually
-- in the Supabase dashboard under Storage.
-- input-audio should be private, output-audio should be public.

-- 1. Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create conversations table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    original_text TEXT NOT NULL,
    translated_text TEXT NOT NULL,
    source_language VARCHAR(10) NOT NULL,
    target_language VARCHAR(10) NOT NULL,
    processing_ms INT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create audio_files table
CREATE TABLE audio_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    input_audio_url TEXT,
    output_audio_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_files ENABLE ROW LEVEL SECURITY;

-- Temporary open policies for development (ensure to restrict in production)
CREATE POLICY "Allow all read on conversations" ON conversations FOR SELECT USING (true);
CREATE POLICY "Allow all insert on conversations" ON conversations FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all read on audio_files" ON audio_files FOR SELECT USING (true);
CREATE POLICY "Allow all insert on audio_files" ON audio_files FOR INSERT WITH CHECK (true);
