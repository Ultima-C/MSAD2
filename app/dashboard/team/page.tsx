'use client'

import { useState } from 'react'
import { useTenant } from '@/lib/providers'
import { useTeamMembers, useTeamInvites, canManageRole } from '@/lib/hooks/use-team'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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

const ROLE_DESCRIPTIONS: Record<TeamRole, string> = {
  owner: 'Full access including billing and team management',
  admin: 'Manage team, clients, and workflows',
  hr_manager: 'Manage clients and workflows',
  support: 'View clients and respond to requests',
  viewer: 'View-only access to clients and workflows',
}

export default function TeamPage() {
  const { tenant, currentRole, can } = useTenant()
  const { members, isLoading: membersLoading, updateMemberRole, removeMember } = useTeamMembers(tenant?.id)
  const { invites, isLoading: invitesLoading, sendInvite, revokeInvite, resendInvite } = useTeamInvites(tenant?.id)
  
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<TeamRole>('viewer')
  const [isInviting, setIsInviting] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null)
  const [inviteToRevoke, setInviteToRevoke] = useState<string | null>(null)

  const handleSendInvite = async () => {
    if (!inviteEmail) return
    setIsInviting(true)
    try {
      await sendInvite(inviteEmail, inviteRole)
      setInviteEmail('')
      setInviteRole('viewer')
      setInviteDialogOpen(false)
    } catch (error) {
      console.error('Error sending invite:', error)
    } finally {
      setIsInviting(false)
    }
  }

  const handleRemoveMember = async () => {
    if (!memberToRemove) return
    try {
      await removeMember(memberToRemove)
    } catch (error) {
      console.error('Error removing member:', error)
    } finally {
      setMemberToRemove(null)
    }
  }

  const handleRevokeInvite = async () => {
    if (!inviteToRevoke) return
    try {
      await revokeInvite(inviteToRevoke)
    } catch (error) {
      console.error('Error revoking invite:', error)
    } finally {
      setInviteToRevoke(null)
    }
  }

  const getAssignableRoles = (): TeamRole[] => {
    if (!currentRole) return []
    const allRoles: TeamRole[] = ['admin', 'hr_manager', 'support', 'viewer']
    return allRoles.filter(role => canManageRole(currentRole, role))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const isExpired = (dateString: string) => {
    return new Date(dateString) < new Date()
  }

  if (!tenant) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Select a workspace to manage team members</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team Management</h1>
          <p className="text-muted-foreground">
            Manage team members and permissions for {tenant.name}
          </p>
        </div>
        {can('manage_team') && (
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <line x1="19" x2="19" y1="8" y2="14"/>
                  <line x1="22" x2="16" y1="11" y2="11"/>
                </svg>
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Send an invite to add a new member to {tenant.name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="colleague@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as TeamRole)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getAssignableRoles().map((role) => (
                        <SelectItem key={role} value={role}>
                          <div className="flex flex-col">
                            <span>{ROLE_LABELS[role]}</span>
                            <span className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[role]}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendInvite} disabled={!inviteEmail || isInviting}>
                  {isInviting ? 'Sending...' : 'Send Invite'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Role Overview Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        {(['owner', 'admin', 'hr_manager', 'support', 'viewer'] as TeamRole[]).map((role) => {
          const count = members.filter(m => m.role === role).length
          return (
            <Card key={role} className="relative overflow-hidden">
              <div className={cn("absolute inset-0 opacity-10", ROLE_COLORS[role].split(' ')[0])} />
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{ROLE_LABELS[role]}s</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{count}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Tabs for Members and Invites */}
      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members">
            Team Members ({members.length})
          </TabsTrigger>
          <TabsTrigger value="invites">
            Pending Invites ({invites.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                People who have access to this workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              {membersLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No team members yet. Invite someone to get started.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="w-[50px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-sm font-medium">
                              {member.user_email?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div>
                              <p className="font-medium">{member.user_name || 'Unknown'}</p>
                              <p className="text-sm text-muted-foreground">{member.user_email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn(ROLE_COLORS[member.role])}>
                            {ROLE_LABELS[member.role]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(member.joined_at)}
                        </TableCell>
                        <TableCell>
                          {can('manage_team') && currentRole && canManageRole(currentRole, member.role) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                    <circle cx="12" cy="12" r="1"/>
                                    <circle cx="12" cy="5" r="1"/>
                                    <circle cx="12" cy="19" r="1"/>
                                  </svg>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {getAssignableRoles().map((role) => (
                                  <DropdownMenuItem
                                    key={role}
                                    onClick={() => updateMemberRole(member.id, role)}
                                    disabled={member.role === role}
                                  >
                                    Change to {ROLE_LABELS[role]}
                                  </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => setMemberToRemove(member.id)}
                                >
                                  Remove from team
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invites">
          <Card>
            <CardHeader>
              <CardTitle>Pending Invites</CardTitle>
              <CardDescription>
                Invitations that have been sent but not yet accepted
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invitesLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : invites.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pending invites
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead className="w-[100px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invites.map((invite) => (
                      <TableRow key={invite.id}>
                        <TableCell className="font-medium">{invite.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn(ROLE_COLORS[invite.role])}>
                            {ROLE_LABELS[invite.role]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(invite.created_at)}
                        </TableCell>
                        <TableCell>
                          {isExpired(invite.expires_at) ? (
                            <Badge variant="destructive">Expired</Badge>
                          ) : (
                            <span className="text-muted-foreground">{formatDate(invite.expires_at)}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => resendInvite(invite.id)}
                            >
                              Resend
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => setInviteToRevoke(invite.id)}
                            >
                              Revoke
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Remove Member Confirmation */}
      <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove team member?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the member from this workspace. They will lose access to all resources.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveMember} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke Invite Confirmation */}
      <AlertDialog open={!!inviteToRevoke} onOpenChange={() => setInviteToRevoke(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke invite?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the invitation. The recipient will no longer be able to join using this invite link.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevokeInvite} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
