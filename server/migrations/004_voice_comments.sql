-- Add audio support to comments
ALTER TABLE comments ADD COLUMN IF NOT EXISTS audio_data TEXT;
