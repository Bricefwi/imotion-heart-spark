import * as React from 'npm:react@18.3.1'
import {
  Html, Head, Body, Container, Section, Text, Button, Hr, Preview,
} from 'npm:@react-email/components@0.0.22'

interface ConversationSummaryEmailProps {
  clientName?: string
  projectName?: string
  sessionNumber?: number
  phaseReached?: string
  keyInsights?: string[]
  nextSteps?: string[]
  dashboardUrl?: string
  siteName?: string
  siteUrl?: string
}

export const ConversationSummaryEmail = ({
  clientName = 'Client',
  projectName = 'Votre projet',
  sessionNumber = 1,
  phaseReached = 'Découverte',
  keyInsights = [],
  nextSteps = [],
  dashboardUrl = '#',
  siteName = 'Clarivi',
  siteUrl = 'https://imotion-conseils.fr',
}: ConversationSummaryEmailProps) => (
  <Html>
    <Head>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap');
      `}</style>
    </Head>
    <Preview>Résumé de votre échange #{sessionNumber} — {projectName}</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Header */}
        <Section style={header}>
          <Text style={logoText}>Clarivi</Text>
        </Section>

        {/* Hero */}
        <Section style={heroSection}>
          <Text style={emoji}>💬</Text>
          <Text style={heading}>Résumé de votre échange</Text>
          <Text style={subtitle}>Session #{sessionNumber} — {phaseReached}</Text>
        </Section>

        {/* Body */}
        <Section style={bodySection}>
          <Text style={paragraph}>Bonjour {clientName},</Text>
          <Text style={paragraph}>
            Merci pour le temps que vous avez consacré à votre échange avec Marc
            concernant <strong>{projectName}</strong>. Voici un récapitulatif des
            points abordés.
          </Text>
        </Section>

        {/* Key insights */}
        {keyInsights.length > 0 && (
          <Section style={bodySection}>
            <Text style={subheading}>📋 Points clés identifiés</Text>
            {keyInsights.map((insight, i) => (
              <Text key={i} style={listItem}>• {insight}</Text>
            ))}
          </Section>
        )}

        {/* Next steps */}
        {nextSteps.length > 0 && (
          <Section style={bodySection}>
            <Text style={subheading}>🚀 Prochaines étapes</Text>
            {nextSteps.map((step, i) => (
              <Text key={i} style={listItem}>
                <span style={stepNumber}>{i + 1}</span> {step}
              </Text>
            ))}
          </Section>
        )}

        {/* CTA */}
        <Section style={ctaSection}>
          <Button style={ctaButton} href={dashboardUrl}>
            Reprendre la conversation
          </Button>
          <Text style={ctaHint}>
            Vous pouvez reprendre à tout moment là où vous vous êtes arrêté.
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
  margin: '0 0 4px',
  lineHeight: '1.3',
}

const subtitle: React.CSSProperties = {
  fontSize: '14px',
  color: '#71717a',
  margin: '0',
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

const listItem: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: '1.6',
  color: '#3f3f46',
  margin: '0 0 8px',
  paddingLeft: '4px',
}

const stepNumber: React.CSSProperties = {
  display: 'inline-block',
  width: '22px',
  height: '22px',
  lineHeight: '22px',
  textAlign: 'center' as const,
  borderRadius: '50%',
  backgroundColor: '#FEE2E2',
  color: '#D32F2F',
  fontSize: '12px',
  fontWeight: 700,
  marginRight: '8px',
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

const ctaHint: React.CSSProperties = {
  fontSize: '13px',
  color: '#a1a1aa',
  margin: '12px 0 0',
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
