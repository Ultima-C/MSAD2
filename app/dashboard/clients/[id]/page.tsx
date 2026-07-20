'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Calendar,
  Clock,
  MoreVertical,
  Send,
  CheckCircle2,
  Circle,
  Lock,
  FileText,
  Upload,
  CreditCard,
  CalendarDays,
  Edit,
  Trash2,
  ExternalLink,
  Copy,
  RefreshCw,
} from 'lucide-react'
import { useTenant } from '@/lib/providers/tenant-provider'
import { useClient } from '@/lib/hooks/use-clients'
import { createClient } from '@/lib/supabase/client'
import { mutate } from 'swr'
import type { ClientTask, TaskStatus } from '@/lib/types/database'

const statusConfig: Record<string, { label: string; color: string }> = {
  invited: { label: 'Invited', color: 'bg-blue-100 text-blue-800' },
  in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
  awaiting_review: { label: 'Awaiting Review', color: 'bg-purple-100 text-purple-800' },
  complete: { label: 'Complete', color: 'bg-green-100 text-green-800' },
}

const taskStatusConfig: Record<TaskStatus, { icon: React.ReactNode; color: string }> = {
  locked: { icon: <Lock className="h-4 w-4" />, color: 'text-muted-foreground' },
  pending: { icon: <Circle className="h-4 w-4" />, color: 'text-blue-600' },
  in_progress: { icon: <Clock className="h-4 w-4" />, color: 'text-yellow-600' },
  complete: { icon: <CheckCircle2 className="h-4 w-4" />, color: 'text-green-600' },
  verified: { icon: <CheckCircle2 className="h-4 w-4 fill-current" />, color: 'text-green-700' },
}

const stepTypeIcons: Record<string, React.ReactNode> = {
  form: <FileText className="h-4 w-4" />,
  file_upload: <Upload className="h-4 w-4" />,
  signature_upload: <Edit className="h-4 w-4" />,
  payment: <CreditCard className="h-4 w-4" />,
  scheduling: <CalendarDays className="h-4 w-4" />,
  custom: <FileText className="h-4 w-4" />,
}

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string
  const { can } = useTenant()
  const { client, isLoading } = useClient(clientId)
  
  // Derive tasks safely from client - useClient returns tasks nested inside client
  const tasks = client?.tasks ?? []
  
  const supabase = createClient()

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSendReminderDialogOpen, setIsSendReminderDialogOpen] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', email: '', company_name: '', phone: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">Client not found</p>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Back to Pipeline</Link>
        </Button>
      </div>
    )
  }

  const portalUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/portal/${client.portal_token}`

  const handleCopyPortalLink = () => {
    navigator.clipboard.writeText(portalUrl)
  }

  const handleEditClient = async () => {
    if (!can('clients:edit')) return
    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          name: editForm.name,
          email: editForm.email,
          company_name: editForm.company_name || null,
          phone: editForm.phone || null,
        })
        .eq('id', clientId)

      if (error) throw error
      mutate(`client-${clientId}`)
      setIsEditDialogOpen(false)
    } catch (error) {
      console.error('Error updating client:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClient = async () => {
    if (!can('clients:delete')) return
    setIsSubmitting(true)
    try {
      const { error } = await supabase.from('clients').delete().eq('id', clientId)
      if (error) throw error
      router.push('/dashboard')
    } catch (error) {
      console.error('Error deleting client:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRegenerateToken = async () => {
    if (!can('clients:edit')) return
    try {
      const { error } = await supabase
        .from('clients')
        .update({ portal_token: crypto.randomUUID() })
        .eq('id', clientId)

      if (error) throw error
      mutate(`client-${clientId}`)
    } catch (error) {
      console.error('Error regenerating token:', error)
    }
  }

  const handleVerifyTask = async (taskId: string) => {
    if (!can('clients:verify_tasks')) return
    try {
      const { error } = await supabase
        .from('client_tasks')
        .update({
          status: 'verified',
          verified_at: new Date().toISOString(),
        })
        .eq('id', taskId)

      if (error) throw error
      mutate(`client-${clientId}`)
    } catch (error) {
      console.error('Error verifying task:', error)
    }
  }

  const handleMarkComplete = async () => {
    if (!can('clients:edit')) return
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          status: 'complete',
          completed_at: new Date().toISOString(),
        })
        .eq('id', clientId)

      if (error) throw error
      mutate(`client-${clientId}`)
    } catch (error) {
      console.error('Error marking client complete:', error)
    }
  }

  const openEditDialog = () => {
    setEditForm({
      name: client.name,
      email: client.email,
      company_name: client.company_name || '',
      phone: client.phone || '',
    })
    setIsEditDialogOpen(true)
  }

  const completedTasks = tasks.filter(t => t.status === 'complete' || t.status === 'verified').length
  const totalTasks = tasks.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary/10 text-primary text-lg">
                {client.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-semibold">{client.name}</h1>
              <p className="text-muted-foreground">{client.company_name || client.email}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className={statusConfig[client.status]?.color || 'bg-gray-100 text-gray-800'}>
            {statusConfig[client.status]?.label || client.status}
          </Badge>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {can('clients:edit') && (
                <DropdownMenuItem onClick={openEditDialog}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Client
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleCopyPortalLink}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Portal Link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open(portalUrl, '_blank')}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Portal
              </DropdownMenuItem>
              {can('clients:edit') && (
                <DropdownMenuItem onClick={handleRegenerateToken}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate Token
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => setIsSendReminderDialogOpen(true)}>
                <Send className="mr-2 h-4 w-4" />
                Send Reminder
              </DropdownMenuItem>
              {client.status === 'awaiting_review' && can('clients:edit') && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleMarkComplete} className="text-green-600">
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Mark as Complete
                  </DropdownMenuItem>
                </>
              )}
              {can('clients:delete') && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Client
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-muted-foreground">
              {completedTasks} of {totalTasks} tasks completed
            </span>
          </div>
          <Progress value={client.completion_percentage} className="h-2" />
          <p className="mt-2 text-2xl font-bold">{client.completion_percentage}%</p>
        </CardContent>
      </Card>

      {/* Client Info and Tasks */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a href={`mailto:${client.email}`} className="text-sm hover:underline">
                {client.email}
              </a>
            </div>
            {client.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{client.phone}</span>
              </div>
            )}
            {client.company_name && (
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{client.company_name}</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Invited {new Date(client.invited_at).toLocaleDateString()}
              </span>
            </div>
            {client.started_at && (
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Started {new Date(client.started_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Onboarding Tasks</CardTitle>
            <CardDescription>
              {client.logic_mode === 'strict' ? 'Sequential workflow' : 'Parallel workflow'} - 
              Tasks {client.logic_mode === 'strict' ? 'must be completed in order' : 'can be completed in any order'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">All Tasks</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-4">
                <TaskList tasks={tasks} onVerify={handleVerifyTask} canVerify={can('clients:verify_tasks')} />
              </TabsContent>

              <TabsContent value="pending" className="mt-4">
                <TaskList
                  tasks={tasks.filter(t => !['complete', 'verified'].includes(t.status))}
                  onVerify={handleVerifyTask}
                  canVerify={can('clients:verify_tasks')}
                />
              </TabsContent>

              <TabsContent value="completed" className="mt-4">
                <TaskList
                  tasks={tasks.filter(t => ['complete', 'verified'].includes(t.status))}
                  onVerify={handleVerifyTask}
                  canVerify={can('clients:verify_tasks')}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>Update client information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                value={editForm.company_name}
                onChange={(e) => setEditForm({ ...editForm, company_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditClient} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Client</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {client.name}? This action cannot be undone.
              All tasks, documents, and progress will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteClient} disabled={isSubmitting}>
              {isSubmitting ? 'Deleting...' : 'Delete Client'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Reminder Dialog */}
      <Dialog open={isSendReminderDialogOpen} onOpenChange={setIsSendReminderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Reminder</DialogTitle>
            <DialogDescription>
              Send a reminder email to {client.name} about their pending onboarding tasks.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="message">Custom Message (optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a personal message to the reminder email..."
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSendReminderDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsSendReminderDialogOpen(false)}>
              <Send className="mr-2 h-4 w-4" />
              Send Reminder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TaskList({
  tasks,
  onVerify,
  canVerify,
}: {
  tasks: ClientTask[]
  onVerify: (taskId: string) => void
  canVerify: boolean
}) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No tasks found
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => {
        const statusInfo = taskStatusConfig[task.status]
        const typeIcon = stepTypeIcons[task.step_type] || <FileText className="h-4 w-4" />

        return (
          <div
            key={task.id}
            className={`flex items-center justify-between p-4 rounded-lg border ${
              task.status === 'locked' ? 'bg-muted/50' : 'bg-card'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={statusInfo.color}>{statusInfo.icon}</div>
              <div className="flex items-center gap-2 text-muted-foreground">
                {typeIcon}
              </div>
              <div>
                <p className={`font-medium ${task.status === 'locked' ? 'text-muted-foreground' : ''}`}>
                  {task.name}
                </p>
                {task.description && (
                  <p className="text-sm text-muted-foreground">{task.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {task.status.replace('_', ' ')}
              </Badge>
              {task.status === 'complete' && canVerify && (
                <Button size="sm" variant="outline" onClick={() => onVerify(task.id)}>
                  Verify
                </Button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
