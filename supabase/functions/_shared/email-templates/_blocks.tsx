/**
 * Blocs UI partagés pour tous les templates email.
 * Importer ces composants évite de redéclarer paragraphes/CTA/cards dans chaque
 * template, et garantit la cohérence visuelle.
 */
import * as React from 'npm:react@18.3.1'
import { Section, Text, Button as REButton } from 'npm:@react-email/components@0.0.22'
import { COLORS, GRADIENTS, FONTS, RADIUS } from '../brand-tokens.ts'
import { styles } from './_layout.tsx'

export const Heading = ({ children, emoji }: { children: React.ReactNode; emoji?: string }) => (
  <>
    {emoji && <Text style={emojiStyle}>{emoji}</Text>}
    <Text style={styles.heading}>{children}</Text>
  </>
)

export const Subheading = ({ children }: { children: React.ReactNode }) => (
  <Text style={styles.subheading}>{children}</Text>
)

export const Paragraph = ({ children }: { children: React.ReactNode }) => (
  <Text style={styles.paragraph}>{children}</Text>
)

export const Cta = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Section style={styles.ctaSection}>
    <REButton href={href} style={styles.ctaButton}>{children}</REButton>
  </Section>
)

export const Card = ({
  title,
  children,
  variant = 'coral',
}: {
  title?: string
  children: React.ReactNode
  variant?: 'coral' | 'amber' | 'neutral'
}) => {
  const bg =
    variant === 'amber' ? '#FFF7E6' :
    variant === 'neutral' ? COLORS.ink50 :
    COLORS.coral50
  const border =
    variant === 'amber' ? '#FFE2B0' :
    variant === 'neutral' ? COLORS.ink200 :
    COLORS.coral100
  return (
    <Section style={{ ...styles.card, backgroundColor: bg, borderColor: border }}>
      {title && <Text style={cardTitle}>{title}</Text>}
      {children}
    </Section>
  )
}

export const StatLine = ({ label, value }: { label: string; value: string }) => (
  <Text style={statLineStyle}>
    <span style={{ color: COLORS.ink500 }}>{label} : </span>
    <strong style={{ color: COLORS.ink900 }}>{value}</strong>
  </Text>
)

export const ListItem = ({ children }: { children: React.ReactNode }) => (
  <Text style={listItemStyle}>{children}</Text>
)

export const Subtitle = ({ children }: { children: React.ReactNode }) => (
  <Text style={subtitleStyle}>{children}</Text>
)

const emojiStyle: React.CSSProperties = {
  fontSize: '40px',
  margin: '0 0 8px',
  textAlign: 'center' as const,
  fontFamily: FONTS.sans,
}

const subtitleStyle: React.CSSProperties = {
  fontSize: '14px',
  color: COLORS.coral600,
  fontWeight: 600,
  margin: '0 0 16px',
  textAlign: 'center' as const,
  fontFamily: FONTS.sans,
  letterSpacing: '0.5px',
  textTransform: 'uppercase' as const,
}

const cardTitle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 700,
  color: COLORS.coral700,
  margin: '0 0 8px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  fontFamily: FONTS.sans,
}

const statLineStyle: React.CSSProperties = {
  fontSize: '14px',
  margin: '6px 0',
  lineHeight: '1.5',
  fontFamily: FONTS.sans,
}

const listItemStyle: React.CSSProperties = {
  fontSize: '14px',
  color: COLORS.ink600,
  margin: '8px 0',
  paddingLeft: '8px',
  lineHeight: '1.6',
  fontFamily: FONTS.sans,
}

export { COLORS, GRADIENTS, RADIUS }
