import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { LoginForm } from '@/components/auth/LoginForm'
import { MagicLinkForm } from '@/components/auth/MagicLinkForm'
import { GoogleButton } from '@/components/auth/AuthProviderButtons'
import Link from 'next/link'

interface Props {
  searchParams: Promise<{ error?: string }>
}

export default async function LoginPage({ searchParams }: Props) {
  const { error } = await searchParams

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Sign in to your Zuza account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Callback errors surface here (e.g. expired link) */}
        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {decodeURIComponent(error)}
          </div>
        )}

        <GoogleButton />

        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">or</span>
          <Separator className="flex-1" />
        </div>

        <Tabs defaultValue="password">
          <TabsList className="w-full">
            <TabsTrigger value="password" className="flex-1">Password</TabsTrigger>
            <TabsTrigger value="magic" className="flex-1">Magic link</TabsTrigger>
          </TabsList>
          <TabsContent value="password" className="pt-4">
            <LoginForm />
          </TabsContent>
          <TabsContent value="magic" className="pt-4">
            <MagicLinkForm />
          </TabsContent>
        </Tabs>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-primary underline underline-offset-4">
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
