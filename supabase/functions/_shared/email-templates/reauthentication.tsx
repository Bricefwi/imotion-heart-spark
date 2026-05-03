import * as React from 'npm:react@18.3.1'
import { BrandedEmailLayout } from './_layout.tsx'
import { Heading, Paragraph, Cta } from './_blocks.tsx'

interface ReauthenticationEmailProps {
  token?: string
  siteName?: string
  siteUrl?: string
}

export const ReauthenticationEmail = ({
  token = '------',
  siteName,
  siteUrl,
}: ReauthenticationEmailProps) => (
  <BrandedEmailLayout
    preview="Confirmez une action sensible sur votre compte"
    siteName={siteName}
    siteUrl={siteUrl}
  >
    <Heading emoji="🔒">Confirmation de sécurité</Heading>
    <Paragraph>Bonjour,</Paragraph>
    <Paragraph>
      Pour valider une action sensible sur votre compte, saisissez ce code dans
      l'application :
    </Paragraph>
    <Paragraph>
      <span style={{
        display: 'inline-block',
        fontSize: '28px',
        letterSpacing: '8px',
        fontWeight: 700,
        color: '#D63B1A',
        background: '#FFF4F1',
        padding: '12px 24px',
        borderRadius: '10px',
      }}>{token}</span>
    </Paragraph>
    <Paragraph>
      Ce code expire dans 10 minutes. Si vous n'êtes pas à l'origine de cette
      demande, contactez immédiatement notre support.
    </Paragraph>
  </BrandedEmailLayout>
)
