-- Add content_markdown column to documents table for AI-generated document content
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS content_markdown TEXT;
