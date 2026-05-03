import * as React from 'npm:react@18.3.1'
import { BrandedEmailLayout } from './_layout.tsx'
import { Heading, Paragraph, Cta, Card, StatLine } from './_blocks.tsx'

interface DiscoveryCompleteEmailProps {
  clientName?: string
  projectName?: string
  projectCode?: string
  dashboardUrl?: string
  totalSessions?: number
  totalMessages?: number
  siteName?: string
  siteUrl?: string
}

export const DiscoveryCompleteEmail = ({
  clientName = 'Client',
  projectName = 'Votre projet',
  projectCode = '',
  dashboardUrl = '#',
  totalSessions = 0,
  totalMessages = 0,
  siteName,
  siteUrl,
}: DiscoveryCompleteEmailProps) => (
  <BrandedEmailLayout
    preview={`Découverte terminée pour ${projectName} 🎯`}
    siteName={siteName}
    siteUrl={siteUrl}
  >
    <Heading emoji="🎯">Découverte terminée !</Heading>
    <Paragraph>Bonjour {clientName},</Paragraph>
    <Paragraph>
      Bravo ! La phase de découverte pour <strong>{projectName}</strong>
      {projectCode ? ` (réf. ${projectCode})` : ''} est complète.
      Marc va maintenant préparer votre Cahier des Charges détaillé.
    </Paragraph>
    {(totalSessions > 0 || totalMessages > 0) && (
      <Card title="📊 Récap de notre découverte">
        {totalSessions > 0 && <StatLine label="💬 Sessions" value={String(totalSessions)} />}
        {totalMessages > 0 && <StatLine label="✉️ Messages échangés" value={String(totalMessages)} />}
      </Card>
    )}
    <Paragraph>
      Vous recevrez votre CDC sous 48h. En attendant, vous pouvez consulter le
      résumé de vos échanges dans votre espace.
    </Paragraph>
    <Cta href={dashboardUrl}>Accéder à mon espace</Cta>
  </BrandedEmailLayout>
)
