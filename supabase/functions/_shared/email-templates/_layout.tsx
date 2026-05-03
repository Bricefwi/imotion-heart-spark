/**
 * BrandedEmailLayout — Layout partagé pour TOUS les emails (auth + transactionnels).
 *
 * Tous les templates de `_shared/email-templates/*.tsx` doivent envelopper leur
 * contenu dans <BrandedEmailLayout> pour garantir une identité visuelle unifiée
 * (header gradient flame, footer, fonts Inter, palette IMOTION v2).
 *
 * Ne jamais ré-écrire à la main les hex de marque dans un template :
 * importer COLORS/GRADIENTS depuis `../brand-tokens.ts`.
 */
import * as React from 'npm:react@18.3.1'
import {
  Html, Head, Body, Container, Section, Text, Hr, Preview, Link,
} from 'npm:@react-email/components@0.0.22'
import { BRAND, COLORS, GRADIENTS, FONTS, RADIUS } from '../brand-tokens.ts'

interface BrandedEmailLayoutProps {
  preview: string
  children: React.ReactNode
  siteName?: string
  siteUrl?: string
  hideFooterContact?: boolean
}

export const BrandedEmailLayout = ({
  preview,
  children,
  siteName = BRAND.name,
  siteUrl = BRAND.url,
  hideFooterContact = false,
}: BrandedEmailLayoutProps) => (
  <Html lang="fr" dir="ltr">
    <Head>
      <meta name="color-scheme" content="light" />
      <meta name="supported-color-schemes" content="light" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
    </Head>
    <Preview>{preview}</Preview>
    <Body style={styles.body}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Text style={styles.logoText}>IMOTION</Text>
          <Text style={styles.logoTagline}>Creator Studio</Text>
        </Section>

        <Section style={styles.content}>{children}</Section>

        <Hr style={styles.hr} />

        <Section style={styles.footer}>
          <Text style={styles.footerText}>
            Email envoyé par{' '}
            <Link href={siteUrl} style={styles.link}>{siteName}</Link>.
          </Text>
          {!hideFooterContact && (
            <Text style={styles.footerText}>
              Une question ? Répondez directement à cet email ou écrivez à{' '}
              <Link href={`mailto:${BRAND.supportEmail}`} style={styles.link}>
                {BRAND.supportEmail}
              </Link>.
            </Text>
          )}
        </Section>
      </Container>
    </Body>
  </Html>
)

/* -------------------------------------------------------------------------- */
/*  Styles partagés (export pour réutilisation dans les templates enfants)    */
/* -------------------------------------------------------------------------- */
export const styles = {
  body: {
    backgroundColor: COLORS.bgPage,
    fontFamily: FONTS.sans,
    margin: 0,
    padding: '24px 0',
  } as React.CSSProperties,

  container: {
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    boxShadow: '0 4px 24px rgba(15, 13, 11, 0.06)',
  } as React.CSSProperties,

  header: {
    background: GRADIENTS.flame,
    padding: '28px 32px',
    textAlign: 'center' as const,
  } as React.CSSProperties,

  logoText: {
    color: COLORS.white,
    fontSize: '26px',
    fontWeight: 700,
    margin: 0,
    letterSpacing: '-0.5px',
    fontFamily: FONTS.sans,
  } as React.CSSProperties,

  logoTagline: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: '12px',
    fontWeight: 500,
    margin: '4px 0 0',
    letterSpacing: '1.5px',
    textTransform: 'uppercase' as const,
    fontFamily: FONTS.sans,
  } as React.CSSProperties,

  content: {
    padding: '32px 32px 8px',
  } as React.CSSProperties,

  heading: {
    fontSize: '24px',
    fontWeight: 700,
    color: COLORS.ink900,
    margin: '0 0 16px',
    lineHeight: '1.3',
    fontFamily: FONTS.sans,
  } as React.CSSProperties,

  subheading: {
    fontSize: '18px',
    fontWeight: 600,
    color: COLORS.ink900,
    margin: '24px 0 12px',
    fontFamily: FONTS.sans,
  } as React.CSSProperties,

  paragraph: {
    fontSize: '15px',
    lineHeight: '1.65',
    color: COLORS.ink600,
    margin: '0 0 14px',
    fontFamily: FONTS.sans,
  } as React.CSSProperties,

  ctaSection: {
    textAlign: 'center' as const,
    padding: '16px 0 24px',
  } as React.CSSProperties,

  ctaButton: {
    background: GRADIENTS.flame,
    color: COLORS.white,
    fontSize: '15px',
    fontWeight: 600,
    padding: '14px 32px',
    borderRadius: RADIUS.md,
    textDecoration: 'none',
    display: 'inline-block',
    fontFamily: FONTS.sans,
    boxShadow: '0 8px 20px -8px rgba(214, 59, 26, 0.5)',
  } as React.CSSProperties,

  hr: {
    borderColor: COLORS.ink200,
    margin: '8px 32px',
  } as React.CSSProperties,

  footer: {
    padding: '16px 32px 28px',
    textAlign: 'center' as const,
  } as React.CSSProperties,

  footerText: {
    fontSize: '12px',
    color: COLORS.ink400,
    margin: '0 0 4px',
    lineHeight: '1.5',
    fontFamily: FONTS.sans,
  } as React.CSSProperties,

  link: {
    color: COLORS.coral600,
    textDecoration: 'underline',
  } as React.CSSProperties,

  highlight: {
    color: COLORS.coral600,
    fontWeight: 600,
  } as React.CSSProperties,

  card: {
    backgroundColor: COLORS.coral50,
    border: `1px solid ${COLORS.coral100}`,
    borderRadius: RADIUS.md,
    padding: '16px 20px',
    margin: '16px 0',
  } as React.CSSProperties,
}
