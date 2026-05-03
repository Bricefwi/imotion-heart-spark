import * as React from 'npm:react@18.3.1'
import { BrandedEmailLayout } from './_layout.tsx'
import { Heading, Paragraph, Cta, Card, StatLine } from './_blocks.tsx'

interface DevelopmentStartedEmailProps {
  clientName?: string
  projectName?: string
  projectCode?: string
  dashboardUrl?: string
  estimatedEnd?: string
  consultantName?: string
  siteName?: string
  siteUrl?: string
}

export const DevelopmentStartedEmail = ({
  clientName = 'Client',
  projectName = 'Votre projet',
  projectCode = '',
  dashboardUrl = '#',
  estimatedEnd = '',
  consultantName = '',
  siteName,
  siteUrl,
}: DevelopmentStartedEmailProps) => (
  <BrandedEmailLayout
    preview={`Le développement de ${projectName} a démarré !`}
    siteName={siteName}
    siteUrl={siteUrl}
  >
    <Heading emoji="🚀">Le développement a démarré !</Heading>
    <Paragraph>Bonjour {clientName},</Paragraph>
    <Paragraph>
      Excellente nouvelle ! Le développement de <strong>{projectName}</strong>
      {projectCode ? ` (réf. ${projectCode})` : ''} est officiellement lancé.
      Notre équipe technique est à pied d'œuvre.
    </Paragraph>
    {(consultantName || estimatedEnd) && (
      <Card title="📅 Suivi du projet" variant="amber">
        {consultantName && <StatLine label="👤 Consultant dédié" value={consultantName} />}
        {estimatedEnd && <StatLine label="🎯 Livraison estimée" value={estimatedEnd} />}
      </Card>
    )}
    <Cta href={dashboardUrl}>Suivre l'avancement</Cta>
  </BrandedEmailLayout>
)
