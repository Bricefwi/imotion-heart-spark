import * as React from 'npm:react@18.3.1'
import { BrandedEmailLayout } from './_layout.tsx'
import { Heading, Paragraph, Cta, Card, StatLine } from './_blocks.tsx'

interface ContractSignedEmailProps {
  clientName?: string
  projectName?: string
  projectCode?: string
  dashboardUrl?: string
  contractAmount?: string
  estimatedStart?: string
  siteName?: string
  siteUrl?: string
}

export const ContractSignedEmail = ({
  clientName = 'Client',
  projectName = 'Votre projet',
  projectCode = '',
  dashboardUrl = '#',
  contractAmount = '',
  estimatedStart = '',
  siteName,
  siteUrl,
}: ContractSignedEmailProps) => (
  <BrandedEmailLayout
    preview={`Contrat signé pour ${projectName} — C'est parti !`}
    siteName={siteName}
    siteUrl={siteUrl}
  >
    <Heading emoji="🤝">Contrat signé, c'est parti !</Heading>
    <Paragraph>Bonjour {clientName},</Paragraph>
    <Paragraph>
      Le contrat pour <strong>{projectName}</strong>
      {projectCode ? ` (réf. ${projectCode})` : ''} a été signé avec succès.
      Nous sommes ravis de démarrer cette collaboration !
    </Paragraph>
    {(contractAmount || estimatedStart) && (
      <Card title="📋 Détails du contrat">
        {contractAmount && <StatLine label="💰 Montant" value={`${contractAmount} € TTC`} />}
        {estimatedStart && <StatLine label="🚀 Démarrage prévu" value={estimatedStart} />}
      </Card>
    )}
    <Cta href={dashboardUrl}>Accéder à mon espace projet</Cta>
  </BrandedEmailLayout>
)
