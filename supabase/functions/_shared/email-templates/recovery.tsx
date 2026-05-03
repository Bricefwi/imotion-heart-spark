import * as React from 'npm:react@18.3.1'
import { BrandedEmailLayout } from './_layout.tsx'
import { Heading, Paragraph, Cta } from './_blocks.tsx'

interface RecoveryEmailProps {
  recoveryUrl?: string
  siteName?: string
  siteUrl?: string
}

export const RecoveryEmail = ({
  recoveryUrl = '#',
  siteName,
  siteUrl,
}: RecoveryEmailProps) => (
  <BrandedEmailLayout
    preview="Réinitialisation de votre mot de passe"
    siteName={siteName}
    siteUrl={siteUrl}
  >
    <Heading emoji="🔑">Réinitialisez votre mot de passe</Heading>
    <Paragraph>Bonjour,</Paragraph>
    <Paragraph>
      Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton
      ci-dessous pour en définir un nouveau.
    </Paragraph>
    <Cta href={recoveryUrl}>Réinitialiser mon mot de passe</Cta>
    <Paragraph>
      Ce lien expire dans 1 heure. Si vous n'êtes pas à l'origine de cette demande,
      ignorez simplement cet email — votre mot de passe restera inchangé.
    </Paragraph>
  </BrandedEmailLayout>
)
