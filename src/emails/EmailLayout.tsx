import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Img,
} from '@react-email/components'

interface Props {
  preview: string
  children: React.ReactNode
}

const BRAND_YELLOW = '#FFCF00'
const DARK_BG      = '#111111'
const CARD_BG      = '#1a1a1a'
const MUTED        = '#888888'
const FONT         = "'Space Grotesk', 'Inter', Arial, sans-serif"

export function EmailLayout({ preview, children }: Props) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: DARK_BG, fontFamily: FONT, margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 560, margin: '0 auto', padding: '40px 16px' }}>

          {/* Logo */}
          <Section style={{ textAlign: 'center', marginBottom: 32 }}>
            <Text style={{
              fontSize: 28,
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.5px',
              margin: 0,
              fontFamily: FONT,
            }}>
              ZU<span style={{ color: BRAND_YELLOW }}>ZA</span>
            </Text>
          </Section>

          {/* Card */}
          <Section style={{
            backgroundColor: CARD_BG,
            borderRadius: 12,
            padding: '36px 32px',
            border: '1px solid #2a2a2a',
          }}>
            {children}
          </Section>

          {/* Footer */}
          <Section style={{ textAlign: 'center', marginTop: 24 }}>
            <Text style={{ color: MUTED, fontSize: 12, margin: 0, fontFamily: FONT }}>
              © {new Date().getFullYear()} Zuza Technologies · South Africa
            </Text>
            <Text style={{ color: MUTED, fontSize: 12, margin: '4px 0 0', fontFamily: FONT }}>
              If you didn&apos;t request this email, you can safely ignore it.
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}

export const emailStyles = {
  h1: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 700,
    margin: '0 0 8px',
    fontFamily: FONT,
  },
  p: {
    color: '#cccccc',
    fontSize: 15,
    lineHeight: '24px',
    margin: '0 0 20px',
    fontFamily: FONT,
  },
  button: {
    backgroundColor: BRAND_YELLOW,
    color: '#111111',
    borderRadius: 8,
    padding: '14px 28px',
    fontWeight: 700,
    fontSize: 15,
    textDecoration: 'none',
    display: 'inline-block',
    fontFamily: FONT,
  },
  divider: {
    borderTop: '1px solid #2a2a2a',
    margin: '24px 0',
  },
  small: {
    color: '#888888',
    fontSize: 12,
    fontFamily: FONT,
  },
}
