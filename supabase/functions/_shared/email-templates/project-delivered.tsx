import * as React from 'npm:react@18.3.1'
import { BrandedEmailLayout } from './_layout.tsx'
import { Heading, Paragraph, Cta, Card, StatLine } from './_blocks.tsx'

interface ProjectDeliveredEmailProps {
  clientName?: string
  projectName?: string
  projectCode?: string
  dashboardUrl?: string
  productionUrl?: string
  siteName?: string
  siteUrl?: string
}

export const ProjectDeliveredEmail = ({
  clientName = 'Client',
  projectName = 'Votre projet',
  projectCode = '',
  dashboardUrl = '#',
  productionUrl = '',
  siteName,
  siteUrl,
}: ProjectDeliveredEmailProps) => (
  <BrandedEmailLayout
    preview={`${projectName} est livré ! 🎊`}
    siteName={siteName}
    siteUrl={siteUrl}
  >
    <Heading emoji="🎊">Votre projet est livré !</Heading>
    <Paragraph>Bonjour {clientName},</Paragraph>
    <Paragraph>
      <strong>{projectName}</strong>
      {projectCode ? ` (réf. ${projectCode})` : ''} est désormais en ligne.
      Bravo, c'est une étape majeure !
    </Paragraph>
    {productionUrl && (
      <Card title="🌐 Accès à votre projet" variant="amber">
        <StatLine label="URL de production" value={productionUrl} />
      </Card>
    )}
    <Cta href={productionUrl || dashboardUrl}>
      {productionUrl ? 'Voir mon site en ligne' : 'Accéder à mon espace'}
    </Cta>
    <Paragraph>
      Notre équipe reste à votre disposition pour la maintenance et les évolutions futures.
    </Paragraph>
  </BrandedEmailLayout>
)
