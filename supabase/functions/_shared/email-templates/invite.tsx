import * as React from 'npm:react@18.3.1'
import { BrandedEmailLayout } from './_layout.tsx'
import { Heading, Paragraph, Cta } from './_blocks.tsx'

interface InviteEmailProps {
  inviteUrl?: string
  inviterName?: string
  organizationName?: string
  siteName?: string
  siteUrl?: string
}

export const InviteEmail = ({
  inviteUrl = '#',
  inviterName = '',
  organizationName = '',
  siteName,
  siteUrl,
}: InviteEmailProps) => (
  <BrandedEmailLayout
    preview="Vous êtes invité à rejoindre IMOTION Creator Studio"
    siteName={siteName}
    siteUrl={siteUrl}
  >
    <Heading emoji="🎉">Vous êtes invité !</Heading>
    <Paragraph>Bonjour,</Paragraph>
    <Paragraph>
      {inviterName ? <strong>{inviterName}</strong> : "Un membre de l'équipe"}{' '}
      vous invite à rejoindre {organizationName ? <strong>{organizationName}</strong> : 'son espace'} sur
      IMOTION Creator Studio.
    </Paragraph>
    <Cta href={inviteUrl}>Accepter l'invitation</Cta>
    <Paragraph>
      Ce lien est valide 24 heures. Si vous ne reconnaissez pas cette invitation,
      ignorez simplement cet email.
    </Paragraph>
  </BrandedEmailLayout>
)
