-- Fix: Replace Clarivi brand name with IMOTION in document templates
UPDATE document_templates
SET content = REPLACE(content, 'Clarivi', 'IMOTION Conseil')
WHERE content LIKE '%Clarivi%';
