import * as React from 'npm:react@18.3.1'
import {
  Html, Head, Body, Container, Section, Text, Button, Hr, Preview,
} from 'npm:@react-email/components@0.0.22'

interface DiscoveryCompleteEmailProps {
  clientName?: string
  projectName?: string
  projectCode?: string
  dashboardUrl?: string
  siteName?: string
  siteUrl?: string
  totalMessages?: number
  totalSessions?: number
}

export const DiscoveryCompleteEmail = ({
  clientName = 'Client',
  projectName = 'Votre projet',
  projectCode = '',
  dashboardUrl = '#',
  siteName = 'IMOTION Creator Studio',
  siteUrl = 'https://imotion-conseils.fr',
  totalMessages = 0,
  totalSessions = 0,
}: DiscoveryCompleteEmailProps) => (
  <Html>
    <Head />
    <Preview>Phase Discovery terminée pour {projectName} — Bravo !</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={logoText}>{siteName}</Text>
        </Section>

        <Section style={heroSection}>
          <Text style={emoji}>🏆</Text>
          <Text style={heading}>Phase Discovery terminée !</Text>
        </Section>

        <Section style={bodySection}>
          <Text style={paragraph}>Bonjour {clientName},</Text>
          <Text style={paragraph}>
            Félicitations ! La phase de découverte pour <strong>{projectName}</strong>
            {projectCode ? ` (réf. ${projectCode})` : ''} est maintenant terminée.
          </Text>
          <Text style={paragraph}>
            Grâce à nos échanges, nous avons pu cerner précisément vos besoins,
            votre vision et les contraintes de votre projet. Ces informations vont
            maintenant servir de fondation pour la rédaction de votre Cahier des Charges.
          </Text>
        </Section>

        {(totalMessages > 0 || totalSessions > 0) && (
          <Section style={statsBox}>
            <Text style={statsTitle}>📊 Récapitulatif de la découverte</Text>
            {totalSessions > 0 && (
              <Text style={statLine}>🗓️ <strong>{totalSessions}</strong> session{totalSessions > 1 ? 's' : ''} d'échange</Text>
            )}
            {totalMessages > 0 && (
              <Text style={statLine}>💬 <strong>{totalMessages}</strong> messages échangés</Text>
            )}
          </Section>
        )}

        <Section style={ctaSection}>
          <Button style={ctaButton} href={dashboardUrl}>
            Voir mon tableau de bord
          </Button>
        </Section>

        <Section style={bodySection}>
          <Text style={subheading}>Prochaine étape</Text>
          <Text style={paragraph}>
            📝 <strong>Cahier des Charges</strong> — Notre équipe va synthétiser
            l'ensemble de vos besoins dans un document structuré et professionnel.
            Vous serez notifié dès qu'il sera disponible.
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
