import * as React from 'npm:react@18.3.1'
import { BrandedEmailLayout } from './_layout.tsx'
import { Heading, Subtitle, Paragraph, Cta, Card, ListItem, Subheading } from './_blocks.tsx'

interface ConversationSummaryEmailProps {
  clientName?: string
  projectName?: string
  sessionNumber?: number
  phaseReached?: string
  keyInsights?: string[]
  nextSteps?: string[]
  dashboardUrl?: string
  siteName?: string
  siteUrl?: string
}

export const ConversationSummaryEmail = ({
  clientName = 'Client',
  projectName = 'Votre projet',
  sessionNumber = 1,
  phaseReached = 'Découverte',
  keyInsights = [],
  nextSteps = [],
  dashboardUrl = '#',
  siteName,
  siteUrl,
}: ConversationSummaryEmailProps) => (
  <BrandedEmailLayout
    preview={`Résumé de votre échange #${sessionNumber} — ${projectName}`}
    siteName={siteName}
    siteUrl={siteUrl}
  >
    <Heading emoji="💬">Résumé de votre échange</Heading>
    <Subtitle>Session #{sessionNumber} — {phaseReached}</Subtitle>
    <Paragraph>Bonjour {clientName},</Paragraph>
    <Paragraph>
      Merci pour le temps consacré à votre échange avec Marc concernant{' '}
      <strong>{projectName}</strong>. Voici un récapitulatif des points abordés.
    </Paragraph>
    {keyInsights.length > 0 && (
      <Card title="✨ Points clés identifiés">
        {keyInsights.map((i, idx) => <ListItem key={idx}>• {i}</ListItem>)}
      </Card>
    )}
    {nextSteps.length > 0 && (
      <>
        <Subheading>Prochaines étapes</Subheading>
        {nextSteps.map((s, idx) => <Paragraph key={idx}>→ {s}</Paragraph>)}
      </>
    )}
    <Cta href={dashboardUrl}>Reprendre mon échange</Cta>
  </BrandedEmailLayout>
)
