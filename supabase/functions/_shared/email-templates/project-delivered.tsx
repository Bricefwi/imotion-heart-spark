import * as React from 'npm:react@18.3.1'
import {
  Html, Head, Body, Container, Section, Text, Button, Hr, Preview,
} from 'npm:@react-email/components@0.0.22'

interface ProjectDeliveredEmailProps {
  clientName?: string
  projectName?: string
  projectCode?: string
  dashboardUrl?: string
  deliveryDate?: string
  siteName?: string
  siteUrl?: string
}

export const ProjectDeliveredEmail = ({
  clientName = 'Client',
  projectName = 'Votre projet',
  projectCode = '',
  dashboardUrl = '#',
  deliveryDate = '',
  siteName = 'IMOTION Creator Studio',
  siteUrl = 'https://imotion-conseils.fr',
}: ProjectDeliveredEmailProps) => (
  <Html>
    <Head />
    <Preview>Votre projet {projectName} a été livré — Félicitations !</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={logoText}>{siteName}</Text>
        </Section>

        <Section style={heroSection}>
          <Text style={emoji}>🎉</Text>
          <Text style={heading}>Votre projet est livré !</Text>
        </Section>

        <Section style={bodySection}>
          <Text style={paragraph}>Bonjour {clientName},</Text>
          <Text style={paragraph}>
            Nous avons le plaisir de vous annoncer que <strong>{projectName}</strong>
            {projectCode ? ` (réf. ${projectCode})` : ''} a été livré avec succès !
          </Text>
          <Text style={paragraph}>
            Tout est en place et opérationnel. Nous espérons que le résultat est à la
            hauteur de vos attentes.
          </Text>
        </Section>

        <Section style={statsBox}>
          <Text style={statsTitle}>✅ Récapitulatif de livraison</Text>
          {deliveryDate && <Text style={statLine}>📅 <strong>Date de livraison :</strong> {deliveryDate}</Text>}
          <Text style={statLine}>🛡️ <strong>Garantie :</strong> 3 mois de garantie corrective inclus</Text>
          <Text style={statLine}>📞 <strong>Support :</strong> Votre consultant reste disponible</Text>
        </Section>

        <Section style={ctaSection}>
          <Button style={ctaButton} href={dashboardUrl}>
            Accéder à mon projet
          </Button>
        </Section>

        <Section style={bodySection}>
          <Text style={subheading}>Et maintenant ?</Text>
          <Text style={paragraph}>
            🔍 <strong>Recettage</strong> — Testez votre projet en conditions réelles.
            Signalez-nous toute anomalie pendant la période de garantie.
          </Text>
          <Text style={paragraph}>
            🛡️ <strong>Maintenance</strong> — Pensez à souscrire une formule de
            maintenance pour garantir la pérennité de votre projet.
          </Text>
          <Text style={paragraph}>
            ⭐ <strong>Votre avis compte</strong> — N'hésitez pas à nous partager
            votre retour d'expérience, il nous aide à nous améliorer.
          </Text>
        </Section>

        <Hr style={hr} />
        <Section style={footer}>
          <Text style={footerText}>
            Merci pour votre confiance !
          </Text>
          <Text style={footerText}>
            <a href={siteUrl} style={link}>{siteName}</a>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

const main: React.CSSProperties = { backgroundColor: '#f4f4f5', fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }
const container: React.CSSProperties = { maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden' }
const header: React.CSSProperties = { background: 'linear-gradient(135deg, #D63B1A, #F08A00)', padding: '24px 32px', textAlign: 'center' as const }
const logoText: React.CSSProperties = { color: '#ffffff', fontSize: '24px', fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }
const heroSection: React.CSSProperties = { textAlign: 'center' as const, padding: '32px 32px 0' }
const emoji: React.CSSProperties = { fontSize: '48px', margin: '0 0 8px' }
const heading: React.CSSProperties = { fontSize: '24px', fontWeight: 700, color: '#18181b', margin: '0 0 8px', lineHeight: '1.3' }
const subheading: React.CSSProperties = { fontSize: '18px', fontWeight: 600, color: '#18181b', margin: '0 0 12px' }
const bodySection: React.CSSProperties = { padding: '24px 32px' }
const paragraph: React.CSSProperties = { fontSize: '15px', lineHeight: '1.6', color: '#3f3f46', margin: '0 0 12px' }
const ctaSection: React.CSSProperties = { textAlign: 'center' as const, padding: '8px 32px 24px' }
const ctaButton: React.CSSProperties = { background: 'linear-gradient(135deg, #D63B1A, #F08A00)', color: '#ffffff', fontSize: '16px', fontWeight: 600, padding: '14px 32px', borderRadius: '12px', textDecoration: 'none', display: 'inline-block' }
const statsBox: React.CSSProperties = { margin: '0 32px', padding: '20px 24px', backgroundColor: '#fafafa', borderRadius: '12px', border: '1px solid #e4e4e7' }
const statsTitle: React.CSSProperties = { fontSize: '16px', fontWeight: 600, color: '#18181b', margin: '0 0 12px' }
const statLine: React.CSSProperties = { fontSize: '14px', color: '#3f3f46', margin: '0 0 6px' }
const hr: React.CSSProperties = { borderColor: '#e4e4e7', margin: '0 32px' }
const footer: React.CSSProperties = { padding: '24px 32px', textAlign: 'center' as const }
const footerText: React.CSSProperties = { fontSize: '13px', color: '#a1a1aa', margin: '0 0 4px' }
const link: React.CSSProperties = { color: '#D63B1A', textDecoration: 'underline' }
