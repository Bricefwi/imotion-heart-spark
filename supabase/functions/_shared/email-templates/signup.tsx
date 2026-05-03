import * as React from 'npm:react@18.3.1'
import { BrandedEmailLayout } from './_layout.tsx'
import { Heading, Paragraph, Cta } from './_blocks.tsx'

interface SignupEmailProps {
  confirmationUrl?: string
  siteName?: string
  siteUrl?: string
}

export const SignupEmail = ({
  confirmationUrl = '#',
  siteName,
  siteUrl,
}: SignupEmailProps) => (
  <BrandedEmailLayout
    preview="Bienvenue sur IMOTION Creator Studio — confirmez votre email"
    siteName={siteName}
    siteUrl={siteUrl}
  >
    <Heading emoji="👋">Bienvenue !</Heading>
    <Paragraph>Bonjour,</Paragraph>
    <Paragraph>
      Merci d'avoir créé un compte sur <strong>IMOTION Creator Studio</strong>.
      Pour activer votre espace et commencer à structurer votre projet, confirmez
      votre adresse email.
    </Paragraph>
    <Cta href={confirmationUrl}>Confirmer mon email</Cta>
    <Paragraph>
      Si vous n'avez pas créé de compte, ignorez simplement cet email.
    </Paragraph>
  </BrandedEmailLayout>
)
