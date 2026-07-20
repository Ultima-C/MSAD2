'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { useTenant } from '@/lib/providers/tenant-provider'
import { createClient } from '@/lib/supabase/client'
import { mutate } from 'swr'
import { Building2, Mail, Phone, Globe, MapPin, AlertTriangle } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export default function OrganizationSettingsPage() {
  const { currentTenant, can, role } = useTenant()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    contact_email: '',
    contact_phone: '',
    website: '',
    address: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')

  useEffect(() => {
    if (currentTenant) {
      setFormData({
        name: currentTenant.name || '',
        slug: currentTenant.slug || '',
        contact_email: currentTenant.contact_email || '',
        contact_phone: currentTenant.contact_phone || '',
        website: currentTenant.website || '',
        address: currentTenant.address || '',
      })
    }
  }, [currentTenant])

  const handleSave = async () => {
    if (!currentTenant || !can('settings:edit')) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          name: formData.name,
          slug: formData.slug,
          contact_email: formData.contact_email || null,
          contact_phone: formData.contact_phone || null,
          website: formData.website || null,
          address: formData.address || null,
        })
        .eq('id', currentTenant.id)

      if (error) throw error
      mutate('tenants')
    } catch (error) {
      console.error('Error updating organization:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteOrganization = async () => {
    if (!currentTenant || role !== 'owner') return

    try {
      const { error } = await supabase.from('tenants').delete().eq('id', currentTenant.id)
      if (error) throw error
      // Redirect to home or show success message
      window.location.href = '/'
    } catch (error) {
      console.error('Error deleting organization:', error)
    }
  }

  const canEdit = can('settings:edit')
  const isOwner = role === 'owner'

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organization Information
          </CardTitle>
          <CardDescription>
            Basic information about your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!canEdit}
                placeholder="Acme Inc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">onboardly.app/</span>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  disabled={!canEdit}
                  placeholder="acme"
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Used for your organization&apos;s unique URL
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave} disabled={isSaving || !canEdit}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardFooter>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>
            How clients can reach your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contact_email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Contact Email
              </Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                disabled={!canEdit}
                placeholder="support@acme.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contact Phone
              </Label>
              <Input
                id="contact_phone"
                type="tel"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                disabled={!canEdit}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="website" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Website
            </Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              disabled={!canEdit}
              placeholder="https://www.acme.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Address
            </Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              disabled={!canEdit}
              placeholder="123 Main St, Suite 100&#10;San Francisco, CA 94105"
              rows={3}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave} disabled={isSaving || !canEdit}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardFooter>
      </Card>

      {/* Danger Zone - Only visible to owners */}
      {isOwner && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible actions that affect your entire organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-destructive/30 p-4">
              <h4 className="font-medium text-destructive mb-2">Delete Organization</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Permanently delete this organization and all of its data, including:
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside mb-4 space-y-1">
                <li>All team members will lose access</li>
                <li>All clients and their onboarding data</li>
                <li>All workflow templates and configurations</li>
                <li>All uploaded documents and files</li>
              </ul>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Delete Organization</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Organization</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-4">
                      <p>
                        This action cannot be undone. This will permanently delete the
                        <strong> {currentTenant?.name}</strong> organization and all associated data.
                      </p>
                      <div className="space-y-2">
                        <Label htmlFor="confirm">
                          Type <strong>{currentTenant?.name}</strong> to confirm
                        </Label>
                        <Input
                          id="confirm"
                          value={deleteConfirmation}
                          onChange={(e) => setDeleteConfirmation(e.target.value)}
                          placeholder={currentTenant?.name}
                        />
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDeleteConfirmation('')}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteOrganization}
                      disabled={deleteConfirmation !== currentTenant?.name}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete Organization
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
