import * as React from 'npm:react@18.3.1'
import {
  Html, Head, Body, Container, Section, Text, Button, Hr, Preview,
} from 'npm:@react-email/components@0.0.22'

interface DevelopmentStartedEmailProps {
  clientName?: string
  projectName?: string
  projectCode?: string
  dashboardUrl?: string
  estimatedEnd?: string
  consultantName?: string
  siteName?: string
  siteUrl?: string
}

export const DevelopmentStartedEmail = ({
  clientName = 'Client',
  projectName = 'Votre projet',
  projectCode = '',
  dashboardUrl = '#',
  estimatedEnd = '',
  consultantName = '',
  siteName = 'IMOTION Creator Studio',
  siteUrl = 'https://imotion-conseils.fr',
}: DevelopmentStartedEmailProps) => (
  <Html>
    <Head />
    <Preview>Le développement de {projectName} a démarré !</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={logoText}>{siteName}</Text>
        </Section>

        <Section style={heroSection}>
          <Text style={emoji}>🚀</Text>
          <Text style={heading}>Le développement a démarré !</Text>
        </Section>

        <Section style={bodySection}>
          <Text style={paragraph}>Bonjour {clientName},</Text>
          <Text style={paragraph}>
            Excellente nouvelle ! Le développement de <strong>{projectName}</strong>
            {projectCode ? ` (réf. ${projectCode})` : ''} est officiellement lancé.
            Notre équipe technique est à pied d'œuvre pour donner vie à votre projet.
          </Text>
        </Section>

        <Section style={statsBox}>
          <Text style={statsTitle}>⚙️ Informations de développement</Text>
          {consultantName && <Text style={statLine}>👤 <strong>Responsable :</strong> {consultantName}</Text>}
          {estimatedEnd && <Text style={statLine}>📅 <strong>Livraison estimée :</strong> {estimatedEnd}</Text>}
          <Text style={statLine}>📊 <strong>Suivi :</strong> Disponible dans votre espace client</Text>
        </Section>

        <Section style={ctaSection}>
          <Button style={ctaButton} href={dashboardUrl}>
            Suivre l'avancement
          </Button>
        </Section>

        <Section style={bodySection}>
          <Text style={subheading}>Pendant le développement</Text>
          <Text style={paragraph}>
            📊 <strong>Suivi en temps réel</strong> — Consultez l'état d'avancement
            de votre projet à tout moment depuis votre tableau de bord.
          </Text>
          <Text style={paragraph}>
            🔔 <strong>Notifications</strong> — Vous serez informé des étapes clés
            et des livrables intermédiaires.
          </Text>
          <Text style={paragraph}>
            💬 <strong>Échanges</strong> — Votre consultant reste disponible pour
            répondre à vos questions.
          </Text>
        </Section>

        <Hr style={hr} />
        <Section style={footer}>
          <Text style={footerText}>
            Cet email a été envoyé par <a href={siteUrl} style={link}>{siteName}</a>.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

const main: React.CSSProperties = { backgroundColor: '#f4f4f5', fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }
const container: React.CSSProperties = { maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden' }
const header: React.CSSProperties = { background: 'linear-gradient(135deg, #D32F2F, #F57C00)', padding: '24px 32px', textAlign: 'center' as const }
const logoText: React.CSSProperties = { color: '#ffffff', fontSize: '24px', fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }
const heroSection: React.CSSProperties = { textAlign: 'center' as const, padding: '32px 32px 0' }
const emoji: React.CSSProperties = { fontSize: '48px', margin: '0 0 8px' }
const heading: React.CSSProperties = { fontSize: '24px', fontWeight: 700, color: '#18181b', margin: '0 0 8px', lineHeight: '1.3' }
const subheading: React.CSSProperties = { fontSize: '18px', fontWeight: 600, color: '#18181b', margin: '0 0 12px' }
const bodySection: React.CSSProperties = { padding: '24px 32px' }
const paragraph: React.CSSProperties = { fontSize: '15px', lineHeight: '1.6', color: '#3f3f46', margin: '0 0 12px' }
const ctaSection: React.CSSProperties = { textAlign: 'center' as const, padding: '8px 32px 24px' }
const ctaButton: React.CSSProperties = { background: 'linear-gradient(135deg, #D32F2F, #F57C00)', color: '#ffffff', fontSize: '16px', fontWeight: 600, padding: '14px 32px', borderRadius: '12px', textDecoration: 'none', display: 'inline-block' }
const statsBox: React.CSSProperties = { margin: '0 32px', padding: '20px 24px', backgroundColor: '#fafafa', borderRadius: '12px', border: '1px solid #e4e4e7' }
const statsTitle: React.CSSProperties = { fontSize: '16px', fontWeight: 600, color: '#18181b', margin: '0 0 12px' }
const statLine: React.CSSProperties = { fontSize: '14px', color: '#3f3f46', margin: '0 0 6px' }
const hr: React.CSSProperties = { borderColor: '#e4e4e7', margin: '0 32px' }
const footer: React.CSSProperties = { padding: '24px 32px', textAlign: 'center' as const }
const footerText: React.CSSProperties = { fontSize: '13px', color: '#a1a1aa', margin: '0 0 4px' }
const link: React.CSSProperties = { color: '#D32F2F', textDecoration: 'underline' }
