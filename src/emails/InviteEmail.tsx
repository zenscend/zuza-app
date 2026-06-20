import { Link, Section, Text, Hr } from '@react-email/components'
import { EmailLayout, emailStyles } from './EmailLayout'

interface Props {
  name?: string
  inviteUrl: string
  role: string
}

export function InviteEmail({ name, inviteUrl, role }: Props) {
  return (
    <EmailLayout preview={`You've been invited to join Zuza as ${role}`}>
      <Text style={emailStyles.h1}>You&apos;re invited to Zuza</Text>
      <Text style={emailStyles.p}>
        {name ? `Hi ${name},` : 'Hi there,'}
      </Text>
      <Text style={emailStyles.p}>
        You&apos;ve been invited to join Zuza as a <strong style={{ color: '#ffffff' }}>{role}</strong>.
        Click the button below to set your password and get started.
      </Text>

      <Section style={{ textAlign: 'center', margin: '28px 0' }}>
        <Link href={inviteUrl} style={emailStyles.button}>
          Accept invitation
        </Link>
      </Section>

      <Hr style={emailStyles.divider} />

      <Text style={emailStyles.small}>
        This invitation expires in 24 hours. If you weren&apos;t expecting this,
        you can safely ignore it.
      </Text>
    </EmailLayout>
  )
}

export default InviteEmail
