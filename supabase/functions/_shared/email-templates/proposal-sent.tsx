import * as React from 'npm:react@18.3.1'
import { BrandedEmailLayout } from './_layout.tsx'
import { Heading, Paragraph, Cta, Card, StatLine } from './_blocks.tsx'

interface ProposalSentEmailProps {
  clientName?: string
  projectName?: string
  proposalUrl?: string
  proposalAmount?: string
  validUntil?: string
  siteName?: string
  siteUrl?: string
}

export const ProposalSentEmail = ({
  clientName = 'Client',
  projectName = 'Votre projet',
  proposalUrl = '#',
  proposalAmount = '',
  validUntil = '',
  siteName,
  siteUrl,
}: ProposalSentEmailProps) => (
  <BrandedEmailLayout
    preview={`Votre devis pour ${projectName} est disponible`}
    siteName={siteName}
    siteUrl={siteUrl}
  >
    <Heading emoji="📄">Votre devis est prêt</Heading>
    <Paragraph>Bonjour {clientName},</Paragraph>
    <Paragraph>
      Suite à notre échange, voici la proposition commerciale pour{' '}
      <strong>{projectName}</strong>. Elle reprend l'ensemble des éléments
      identifiés ensemble pendant la phase de découverte.
    </Paragraph>
    {(proposalAmount || validUntil) && (
      <Card title="💼 Synthèse du devis">
        {proposalAmount && <StatLine label="Montant" value={`${proposalAmount} € TTC`} />}
        {validUntil && <StatLine label="Valide jusqu'au" value={validUntil} />}
      </Card>
    )}
    <Cta href={proposalUrl}>Consulter et signer le devis</Cta>
    <Paragraph>
      Une question ? Répondez directement à cet email, votre consultant vous répondra rapidement.
    </Paragraph>
  </BrandedEmailLayout>
)
