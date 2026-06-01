import { render } from '@react-email/render'
import { ConfirmEmail } from '@/emails/ConfirmEmail'
import { MagicLinkEmail } from '@/emails/MagicLinkEmail'
import { PasswordResetEmail } from '@/emails/PasswordResetEmail'

export async function renderConfirmEmail(name: string | undefined, confirmationUrl: string) {
  return render(<ConfirmEmail name={name} confirmationUrl={confirmationUrl} />)
}

export async function renderMagicLinkEmail(name: string | undefined, magicLink: string) {
  return render(<MagicLinkEmail name={name} magicLink={magicLink} />)
}

export async function renderPasswordResetEmail(name: string | undefined, resetUrl: string) {
  return render(<PasswordResetEmail name={name} resetUrl={resetUrl} />)
}
