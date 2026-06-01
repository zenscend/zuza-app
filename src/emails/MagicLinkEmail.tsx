import { Link, Section, Text, Hr } from '@react-email/components'
import { EmailLayout, emailStyles } from './EmailLayout'

interface Props {
  name?: string
  magicLink: string
}

export function MagicLinkEmail({ name, magicLink }: Props) {
  return (
    <EmailLayout preview="Your Zuza sign-in link">
      <Text style={emailStyles.h1}>Your sign-in link</Text>
      <Text style={emailStyles.p}>
        {name ? `Hi ${name},` : 'Hi there,'}
      </Text>
      <Text style={emailStyles.p}>
        Click the button below to sign in to your Zuza account. This link is valid for 1 hour
        and can only be used once.
      </Text>

      <Section style={{ textAlign: 'center', margin: '28px 0' }}>
        <Link href={magicLink} style={emailStyles.button}>
          Sign in to Zuza
        </Link>
      </Section>

      <Hr style={emailStyles.divider} />

      <Text style={emailStyles.small}>
        If you didn&apos;t request this link, you can safely ignore this email.
        Your account remains secure.
      </Text>
    </EmailLayout>
  )
}

export default MagicLinkEmail
