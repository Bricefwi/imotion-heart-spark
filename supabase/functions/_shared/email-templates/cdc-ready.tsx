import * as React from 'npm:react@18.3.1'
import { BrandedEmailLayout } from './_layout.tsx'
import { Heading, Paragraph, Cta, Subheading } from './_blocks.tsx'

interface CdcReadyEmailProps {
  clientName?: string
  projectName?: string
  documentUrl?: string
  siteName?: string
  siteUrl?: string
}

export const CdcReadyEmail = ({
  clientName = 'Client',
  projectName = 'Votre projet',
  documentUrl = '#',
  siteName,
  siteUrl,
}: CdcReadyEmailProps) => (
  <BrandedEmailLayout
    preview={`Votre Cahier des Charges pour ${projectName} est prêt !`}
    siteName={siteName}
    siteUrl={siteUrl}
  >
    <Heading emoji="🎉">Votre Cahier des Charges est prêt !</Heading>
    <Paragraph>Bonjour {clientName},</Paragraph>
    <Paragraph>
      Bonne nouvelle ! Suite à notre échange, le Cahier des Charges pour{' '}
      <strong>{projectName}</strong> a été finalisé et est disponible dans votre espace.
    </Paragraph>
    <Paragraph>
      Ce document synthétise l'ensemble de vos besoins, objectifs et contraintes
      techniques. Il servira de référence pour la suite du projet.
    </Paragraph>
    <Cta href={documentUrl}>Consulter mon Cahier des Charges</Cta>
    <Subheading>Et maintenant ?</Subheading>
    <Paragraph>📋 <strong>Relisez</strong> le document pour vérifier qu'il correspond à votre vision.</Paragraph>
    <Paragraph>💬 <strong>Échangez</strong> avec votre consultant pour ajuster si besoin.</Paragraph>
    <Paragraph>✅ <strong>Validez</strong> le CDC pour passer à l'estimation détaillée.</Paragraph>
  </BrandedEmailLayout>
)
