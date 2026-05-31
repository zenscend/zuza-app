import { ZuzaLogo } from '@/components/layout/ZuzaLogo'
import { ThemeToggle } from '@/components/layout/ThemeToggle'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4">
        <ZuzaLogo size="md" />
        <ThemeToggle />
      </header>

      {/* Centred card area */}
      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-muted-foreground py-4">
        © {new Date().getFullYear()} Zuza Technologies
      </footer>
    </div>
  )
}
