/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Vous êtes invité(e) à rejoindre IMOTION Creator Studio</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={logoText}>IMOTION Creator Studio</Text>
        </Section>
        <Heading style={h1}>Vous êtes invité(e) !</Heading>
        <Text style={text}>
          Vous avez été invité(e) à rejoindre{' '}
          <Link href={siteUrl} style={link}>
            <strong>IMOTION Creator Studio</strong>
          </Link>
          . Cliquez sur le bouton ci-dessous pour accepter l'invitation et créer votre compte.
        </Text>
        <Section style={buttonContainer}>
          <Button style={button} href={confirmationUrl}>
            Accepter l'invitation
          </Button>
        </Section>
        <Text style={footer}>
          Si vous n'attendiez pas cette invitation, vous pouvez ignorer cet email en toute sécurité.
        </Text>
        <Text style={footerBrand}>© IMOTION Creator Studio — Votre partenaire digital</Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const container = { padding: '40px 25px 30px' }
const header = { textAlign: 'center' as const, marginBottom: '24px' }
const logoText = { fontSize: '28px', fontWeight: 'bold' as const, color: '#D32F2F', margin: '0' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#141B2B', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#6B7280', lineHeight: '1.6', margin: '0 0 20px' }
const link = { color: '#D32F2F', textDecoration: 'underline' }
const buttonContainer = { textAlign: 'center' as const, margin: '8px 0 32px' }
const button = { backgroundColor: '#D32F2F', color: '#ffffff', fontSize: '15px', fontWeight: '600' as const, borderRadius: '16px', padding: '14px 28px', textDecoration: 'none' }
const footer = { fontSize: '13px', color: '#9CA3AF', margin: '0 0 8px' }
const footerBrand = { fontSize: '12px', color: '#D1D5DB', margin: '16px 0 0', textAlign: 'center' as const }
