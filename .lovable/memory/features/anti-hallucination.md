Anti-hallucination safeguards implemented across all AI functions

## ai-chat Edge Function
- System prompt includes explicit anti-hallucination rules and self-check checklist
- Post-processing validation pipeline:
  1. validateExtractedData(): Whitelist fields per phase, remove fabricated data
  2. validateMessage(): Detect invented stats, fake references, absolute promises, unsolicited pricing
  3. validateSentiment(): Cross-check sentiment vs message tone
  4. validatePhaseTransition(): Minimum messages per phase, require data before advancing critical phases
- Flagged messages saved with is_flagged=true and flagged_reason
- Auto-notification to consultant on hallucination detection
- confidence_level and self_check fields in AI response format

## generate-blog-post Edge Function
- Prompt rules: no invented stats, no fake studies, no fabricated testimonials
- Scenarios presented as illustrative ("Prenons l'exemple…") not factual
- Prudent wording: "selon certaines estimations", "on observe fréquemment"

## About page / StatsSection
- Removed unverifiable claims ("150+ entreprises", "98% satisfaction")
- Replaced with factual product descriptors (7 phases, ~45 min, 100% structuré)
