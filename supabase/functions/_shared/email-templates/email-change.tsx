import * as React from 'npm:react@18.3.1'
import { BrandedEmailLayout } from './_layout.tsx'
import { Heading, Paragraph, Cta } from './_blocks.tsx'

interface EmailChangeEmailProps {
  confirmationUrl?: string
  newEmail?: string
  siteName?: string
  siteUrl?: string
}

export const EmailChangeEmail = ({
  confirmationUrl = '#',
  newEmail = '',
  siteName,
  siteUrl,
}: EmailChangeEmailProps) => (
  <BrandedEmailLayout
    preview="Confirmez votre nouvelle adresse email"
    siteName={siteName}
    siteUrl={siteUrl}
  >
    <Heading emoji="✉️">Confirmez votre nouvelle adresse</Heading>
    <Paragraph>Bonjour,</Paragraph>
    <Paragraph>
      Vous avez demandé à modifier votre adresse email vers{' '}
      {newEmail ? <strong>{newEmail}</strong> : 'cette adresse'}. Cliquez ci-dessous pour confirmer.
    </Paragraph>
    <Cta href={confirmationUrl}>Confirmer le changement</Cta>
    <Paragraph>
      Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.
    </Paragraph>
  </BrandedEmailLayout>
)
