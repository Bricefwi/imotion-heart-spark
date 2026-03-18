import * as React from 'npm:react@18.3.1'
import {
  Html, Head, Body, Container, Section, Text, Button, Hr, Img, Preview,
} from 'npm:@react-email/components@0.0.22'

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
  siteName = 'Clarivi',
  siteUrl = 'https://imotion-conseils.fr',
}: CdcReadyEmailProps) => (
  <Html>
    <Head>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap');
      `}</style>
    </Head>
    <Preview>Votre Cahier des Charges pour {projectName} est prêt !</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Header */}
        <Section style={header}>
          <Text style={logoText}>Clarivi</Text>
        </Section>

        {/* Hero */}
        <Section style={heroSection}>
          <Text style={emoji}>🎉</Text>
          <Text style={heading}>Votre Cahier des Charges est prêt !</Text>
        </Section>

        {/* Body */}
        <Section style={bodySection}>
          <Text style={paragraph}>Bonjour {clientName},</Text>
          <Text style={paragraph}>
            Bonne nouvelle ! Suite à notre échange, le Cahier des Charges pour{' '}
            <strong>{projectName}</strong> a été finalisé et est maintenant disponible
            dans votre espace.
          </Text>
          <Text style={paragraph}>
            Ce document synthétise l'ensemble de vos besoins, objectifs et contraintes
            techniques que nous avons identifiés ensemble. Il servira de référence pour
            la suite de votre projet.
          </Text>
        </Section>

        {/* CTA */}
        <Section style={ctaSection}>
          <Button style={ctaButton} href={documentUrl}>
            Consulter mon Cahier des Charges
          </Button>
        </Section>

        {/* Next steps */}
        <Section style={bodySection}>
          <Text style={subheading}>Et maintenant ?</Text>
          <Text style={paragraph}>
            📋 <strong>Relisez</strong> attentivement le document pour vérifier que tout
            correspond à votre vision.
          </Text>
          <Text style={paragraph}>
            💬 <strong>Échangez</strong> avec votre consultant si vous avez des
            ajustements à apporter.
          </Text>
          <Text style={paragraph}>
            ✅ <strong>Validez</strong> le CDC pour passer à l'étape suivante :
            l'estimation détaillée.
          </Text>
        </Section>

        <Hr style={hr} />

        {/* Footer */}
        <Section style={footer}>
          <Text style={footerText}>
            Cet email a été envoyé par{' '}
            <a href={siteUrl} style={link}>{siteName}</a>.
          </Text>
          <Text style={footerText}>
            Si vous avez des questions, répondez directement à cet email.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

// Styles
const main: React.CSSProperties = {
  backgroundColor: '#f4f4f5',
  fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
}

const container: React.CSSProperties = {
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  overflow: 'hidden',
}

const header: React.CSSProperties = {
  background: 'linear-gradient(135deg, #D32F2F, #F57C00)',
  padding: '24px 32px',
  textAlign: 'center' as const,
}

const logoText: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 700,
  margin: 0,
  letterSpacing: '-0.5px',
}

const heroSection: React.CSSProperties = {
  textAlign: 'center' as const,
  padding: '32px 32px 0',
}

const emoji: React.CSSProperties = {
  fontSize: '48px',
  margin: '0 0 8px',
}

const heading: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 700,
  color: '#18181b',
  margin: '0 0 8px',
  lineHeight: '1.3',
}

const subheading: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 600,
  color: '#18181b',
  margin: '0 0 12px',
}

const bodySection: React.CSSProperties = {
  padding: '24px 32px',
}

const paragraph: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: '1.6',
  color: '#3f3f46',
  margin: '0 0 12px',
}

const ctaSection: React.CSSProperties = {
  textAlign: 'center' as const,
  padding: '8px 32px 24px',
}

const ctaButton: React.CSSProperties = {
  background: 'linear-gradient(135deg, #D32F2F, #F57C00)',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 600,
  padding: '14px 32px',
  borderRadius: '12px',
  textDecoration: 'none',
  display: 'inline-block',
}

const hr: React.CSSProperties = {
  borderColor: '#e4e4e7',
  margin: '0 32px',
}

const footer: React.CSSProperties = {
  padding: '24px 32px',
  textAlign: 'center' as const,
}

const footerText: React.CSSProperties = {
  fontSize: '13px',
  color: '#a1a1aa',
  margin: '0 0 4px',
}

const link: React.CSSProperties = {
  color: '#D32F2F',
  textDecoration: 'underline',
}
