import * as React from 'npm:react@18.3.1'
import { BrandedEmailLayout } from './_layout.tsx'
import { Heading, Paragraph, Cta } from './_blocks.tsx'

interface MagicLinkEmailProps {
  magicLink?: string
  siteName?: string
  siteUrl?: string
}

export const MagicLinkEmail = ({
  magicLink = '#',
  siteName,
  siteUrl,
}: MagicLinkEmailProps) => (
  <BrandedEmailLayout
    preview="Votre lien de connexion sécurisé"
    siteName={siteName}
    siteUrl={siteUrl}
  >
    <Heading emoji="🔐">Connectez-vous en un clic</Heading>
    <Paragraph>Bonjour,</Paragraph>
    <Paragraph>
      Voici votre lien de connexion sécurisé. Cliquez sur le bouton ci-dessous
      pour accéder à votre espace IMOTION Creator Studio.
    </Paragraph>
    <Cta href={magicLink}>Me connecter</Cta>
    <Paragraph>
      Ce lien expire dans 1 heure. Si vous n'êtes pas à l'origine de cette demande,
      ignorez cet email.
    </Paragraph>
  </BrandedEmailLayout>
)
