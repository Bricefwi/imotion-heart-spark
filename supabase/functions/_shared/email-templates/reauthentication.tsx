/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Votre code de vérification Clarivi</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={logoText}>Clarivi</Text>
        </Section>
        <Heading style={h1}>Vérification de votre identité</Heading>
        <Text style={text}>
          Utilisez le code ci-dessous pour confirmer votre identité :
        </Text>
        <Section style={codeContainer}>
          <Text style={codeStyle}>{token}</Text>
        </Section>
        <Text style={footer}>
          Ce code expirera dans quelques minutes. Si vous n'avez pas fait cette demande, ignorez cet email.
        </Text>
        <Text style={footerBrand}>© Clarivi — Votre partenaire digital</Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const container = { padding: '40px 25px 30px' }
const header = { textAlign: 'center' as const, marginBottom: '24px' }
const logoText = { fontSize: '28px', fontWeight: 'bold' as const, color: '#D32F2F', margin: '0' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#141B2B', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#6B7280', lineHeight: '1.6', margin: '0 0 20px' }
const codeContainer = { textAlign: 'center' as const, margin: '8px 0 32px', padding: '16px', backgroundColor: '#FEF2F2', borderRadius: '16px' }
const codeStyle = { fontFamily: "'Plus Jakarta Sans', Courier, monospace", fontSize: '32px', fontWeight: 'bold' as const, color: '#D32F2F', letterSpacing: '6px', margin: '0' }
const footer = { fontSize: '13px', color: '#9CA3AF', margin: '0 0 8px' }
const footerBrand = { fontSize: '12px', color: '#D1D5DB', margin: '16px 0 0', textAlign: 'center' as const }
