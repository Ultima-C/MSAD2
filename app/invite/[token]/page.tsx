'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/providers'
import { useAcceptInvite } from '@/lib/hooks/use-team'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { TeamRole } from '@/lib/types/database'

const ROLE_COLORS: Record<TeamRole, string> = {
  owner: 'bg-amber-500/20 text-amber-600 border-amber-500/30',
  admin: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
  hr_manager: 'bg-purple-500/20 text-purple-600 border-purple-500/30',
  support: 'bg-green-500/20 text-green-600 border-green-500/30',
  viewer: 'bg-gray-500/20 text-gray-600 border-gray-500/30',
}

const ROLE_LABELS: Record<TeamRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  hr_manager: 'HR Manager',
  support: 'Support',
  viewer: 'Viewer',
}

interface InviteDetails {
  id: string
  email: string
  role: TeamRole
  expires_at: string
  tenant: {
    id: string
    name: string
    logo_url: string | null
  }
}

export default function AcceptInvitePage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const { user, isLoading: authLoading } = useAuth()
  const { acceptInvite, getInviteDetails } = useAcceptInvite()

  const [invite, setInvite] = useState<InviteDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAccepting, setIsAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function loadInvite() {
      try {
        const data = await getInviteDetails(token)
        setInvite(data as InviteDetails)
      } catch (err: any) {
        setError('This invite link is invalid or has expired.')
      } finally {
        setIsLoading(false)
      }
    }

    loadInvite()
  }, [token, getInviteDetails])

  const handleAccept = async () => {
    setIsAccepting(true)
    setError(null)

    try {
      const tenantId = await acceptInvite(token)
      setSuccess(true)
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to accept invite')
    } finally {
      setIsAccepting(false)
    }
  }

  const isExpired = invite && new Date(invite.expires_at) < new Date()
  const emailMismatch = user && invite && user.email?.toLowerCase() !== invite.email.toLowerCase()

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <p className="text-muted-foreground">Loading invite...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && !invite) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-destructive">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" x2="9" y1="9" y2="15"/>
                <line x1="9" x2="15" y1="9" y2="15"/>
              </svg>
            </div>
            <CardTitle>Invalid Invite</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button asChild>
              <Link href="/">Go to Homepage</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-green-500">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <CardTitle>Welcome to {invite?.tenant.name}!</CardTitle>
            <CardDescription>
              You have successfully joined the team. Redirecting to dashboard...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    // User needs to sign in first
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            {invite?.tenant.logo_url ? (
              <img 
                src={invite.tenant.logo_url} 
                alt={invite.tenant.name} 
                className="mx-auto w-16 h-16 rounded-lg object-contain mb-4"
              />
            ) : (
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-primary">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
            )}
            <CardTitle>Join {invite?.tenant.name}</CardTitle>
            <CardDescription>
              You&apos;ve been invited to join as a{' '}
              <Badge variant="outline" className={cn('mx-1', invite && ROLE_COLORS[invite.role])}>
                {invite && ROLE_LABELS[invite.role]}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">This invite was sent to:</p>
              <p className="font-medium">{invite?.email}</p>
            </div>
            {isExpired && (
              <div className="bg-destructive/10 text-destructive rounded-lg p-4 text-center text-sm">
                This invite has expired. Please ask for a new invite.
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button asChild className="w-full" disabled={!!isExpired}>
              <Link href={`/login?redirect=/invite/${token}`}>
                Sign in to Accept
              </Link>
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Don&apos;t have an account?{' '}
              <Link href={`/register?email=${encodeURIComponent(invite?.email || '')}&redirect=/invite/${token}`} className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // User is signed in
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {invite?.tenant.logo_url ? (
            <img 
              src={invite.tenant.logo_url} 
              alt={invite.tenant.name} 
              className="mx-auto w-16 h-16 rounded-lg object-contain mb-4"
            />
          ) : (
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-primary">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
          )}
          <CardTitle>Join {invite?.tenant.name}</CardTitle>
          <CardDescription>
            You&apos;ve been invited to join as a{' '}
            <Badge variant="outline" className={cn('mx-1', invite && ROLE_COLORS[invite.role])}>
              {invite && ROLE_LABELS[invite.role]}
            </Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">Signed in as:</p>
            <p className="font-medium">{user.email}</p>
          </div>

          {emailMismatch && (
            <div className="bg-amber-500/10 text-amber-600 rounded-lg p-4 text-sm">
              <p className="font-medium mb-1">Email mismatch</p>
              <p>This invite was sent to <strong>{invite?.email}</strong>. You&apos;re signed in with a different email.</p>
            </div>
          )}

          {isExpired && (
            <div className="bg-destructive/10 text-destructive rounded-lg p-4 text-center text-sm">
              This invite has expired. Please ask for a new invite.
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 text-destructive rounded-lg p-4 text-center text-sm">
              {error}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button 
            className="w-full" 
            onClick={handleAccept}
            disabled={isExpired || emailMismatch || isAccepting}
          >
            {isAccepting ? 'Joining...' : 'Accept Invite'}
          </Button>
          <Button variant="ghost" asChild className="w-full">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
