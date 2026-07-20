import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AuthErrorPage() {
  return (
    <div className="space-y-6">
      {/* Mobile Logo */}
      <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-6 h-6 text-primary-foreground"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <span className="text-2xl font-bold text-foreground">Onboardly</span>
      </div>

      <Card className="border-0 shadow-lg text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-8 h-8 text-destructive"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" x2="12" y1="8" y2="12" />
              <line x1="12" x2="12.01" y1="16" y2="16" />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold">Authentication Error</CardTitle>
          <CardDescription className="text-base">
            Something went wrong during authentication. 
            This could be due to an expired link or a technical issue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Common causes:</p>
            <ul className="text-left list-disc list-inside space-y-1">
              <li>The confirmation link has expired</li>
              <li>The link has already been used</li>
              <li>There was a network error</li>
            </ul>
          </div>
          
          <div className="flex flex-col gap-3">
            <Link href="/auth/login">
              <Button className="w-full">
                Try signing in again
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button variant="outline" className="w-full">
                Create a new account
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        Need help?{' '}
        <Link href="/support" className="text-primary hover:underline">
          Contact support
        </Link>
      </p>
    </div>
  )
}
