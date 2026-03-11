Dynamic pricing system with 6 new database tables and document generation

## Tables Added
- pricing_config: Project types (vitrine, ecommerce, webapp, plateforme) with base prices
- pricing_options: 15 add-on modules (design_premium, blog, CRM integration, etc.)
- pricing_maintenance: 3 RUN plans (essentiel 199€, confort 399€, premium 799€)
- document_templates: CDC, Devis, Contrat markdown templates with {{variables}}
- project_estimates: Per-project cost calculations linked to pricing_config
- generated_documents: AI-generated docs with auto-numbering (CDC-2026-0001)

## Key Functions
- calculate_project_estimate(project_id): PL/pgSQL function that analyzes discovery_data to detect project type, calculate options, estimate complexity
- generate_document_number(): Auto-numbering trigger for generated_documents
- set_estimate_not_current(): Marks old estimates as non-current on new insert

## Edge Function
- generate-document: Enhanced to fetch from pricing tables, inject pricing context into AI prompt, save to both documents AND generated_documents tables
- Uses Lovable AI (openai/gpt-5), NOT Anthropic

## Frontend
- PricingSection.tsx fetches from pricing_config and pricing_maintenance tables dynamically
- Falls back to hardcoded data if DB is empty
- 5min staleTime cache on queries
