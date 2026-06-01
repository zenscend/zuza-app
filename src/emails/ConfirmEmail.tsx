import { Link, Section, Text, Hr } from '@react-email/components'
import { EmailLayout, emailStyles } from './EmailLayout'

interface Props {
  name?: string
  confirmationUrl: string
}

export function ConfirmEmail({ name, confirmationUrl }: Props) {
  return (
    <EmailLayout preview="Confirm your Zuza account">
      <Text style={emailStyles.h1}>Confirm your account</Text>
      <Text style={emailStyles.p}>
        {name ? `Hi ${name},` : 'Hi there,'}
      </Text>
      <Text style={emailStyles.p}>
        Thanks for signing up to Zuza. Click the button below to confirm your email address
        and activate your account.
      </Text>

      <Section style={{ textAlign: 'center', margin: '28px 0' }}>
        <Link href={confirmationUrl} style={emailStyles.button}>
          Confirm email address
        </Link>
      </Section>

      <Hr style={emailStyles.divider} />

      <Text style={emailStyles.small}>
        This link expires in 24 hours. If you didn&apos;t create a Zuza account,
        you can safely ignore this email.
      </Text>
    </EmailLayout>
  )
}

export default ConfirmEmail
