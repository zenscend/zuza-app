import { Link, Section, Text, Hr } from '@react-email/components'
import { EmailLayout, emailStyles } from './EmailLayout'

interface Props {
  name?: string
  resetUrl: string
}

export function PasswordResetEmail({ name, resetUrl }: Props) {
  return (
    <EmailLayout preview="Reset your Zuza password">
      <Text style={emailStyles.h1}>Reset your password</Text>
      <Text style={emailStyles.p}>
        {name ? `Hi ${name},` : 'Hi there,'}
      </Text>
      <Text style={emailStyles.p}>
        We received a request to reset your Zuza password. Click the button below to choose
        a new password. This link expires in 1 hour.
      </Text>

      <Section style={{ textAlign: 'center', margin: '28px 0' }}>
        <Link href={resetUrl} style={emailStyles.button}>
          Reset password
        </Link>
      </Section>

      <Hr style={emailStyles.divider} />

      <Text style={emailStyles.small}>
        If you didn&apos;t request a password reset, you can safely ignore this email.
        Your password will not be changed.
      </Text>
    </EmailLayout>
  )
}

export default PasswordResetEmail
