'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useTenant } from '@/lib/providers/tenant-provider'
import { createClient } from '@/lib/supabase/client'
import { mutate } from 'swr'
import { Upload, Palette, Eye, Globe, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const presetColors = [
  '#2563EB', // Blue
  '#7C3AED', // Purple
  '#059669', // Green
  '#DC2626', // Red
  '#EA580C', // Orange
  '#0891B2', // Cyan
  '#4F46E5', // Indigo
  '#DB2777', // Pink
]

export default function BrandingSettingsPage() {
  const { tenant, can } = useTenant()
  const supabase = createClient()

  const [brandColor, setBrandColor] = useState('#2563EB')
  const [logoUrl, setLogoUrl] = useState('')
  const [customDomain, setCustomDomain] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (tenant) {
      setBrandColor(tenant.brand_color || '#2563EB')
      setLogoUrl(tenant.logo_url || '')
    }
  }, [tenant])

  const handleSave = async () => {
    if (!tenant || !canEdit) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          brand_color: brandColor,
          logo_url: logoUrl || null,
        })
        .eq('id', tenant.id)

      if (error) throw error
      mutate('tenants')
      toast.success('Branding updated successfully')
    } catch (error) {
      console.error('Error updating branding:', error)
      toast.error('Failed to save branding changes')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogoUpload = () => {
    // In a real app, this would open a file picker and upload to storage
    console.log('Upload logo')
  }

  // Permission check - owners and admins can edit branding
  const canEdit = can('manage_settings')

  return (
    <div className="space-y-6">
      {/* Brand Color */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Brand Color
          </CardTitle>
          <CardDescription>
            Choose a primary color for your client portal and communications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Color Preview */}
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-lg shadow-inner"
              style={{ backgroundColor: brandColor }}
            />
            <div>
              <Input
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                disabled={!canEdit}
                className="w-32 font-mono uppercase"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Hex color code
              </p>
            </div>
          </div>

          {/* Preset Colors */}
          <div className="space-y-2">
            <Label>Preset Colors</Label>
            <div className="flex flex-wrap gap-2">
              {presetColors.map((color) => (
                <button
                  key={color}
                  onClick={() => canEdit && setBrandColor(color)}
                  disabled={!canEdit}
                  className={`w-10 h-10 rounded-lg transition-transform hover:scale-110 ${
                    brandColor === color ? 'ring-2 ring-offset-2 ring-primary' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <Separator />

          {/* Color Input */}
          <div className="space-y-2">
            <Label htmlFor="color-picker">Custom Color</Label>
            <div className="flex items-center gap-2">
              <input
                id="color-picker"
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                disabled={!canEdit}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <span className="text-sm text-muted-foreground">
                Use the color picker to select any color
              </span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave} disabled={isSaving || !canEdit}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? 'Saving...' : 'Save Color'}
          </Button>
        </CardFooter>
      </Card>

      {/* Logo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Logo
          </CardTitle>
          <CardDescription>
            Upload your company logo to display on the client portal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {logoUrl ? (
            <div className="flex items-center gap-4">
              <div className="w-32 h-32 rounded-lg border flex items-center justify-center bg-muted">
                <img
                  src={logoUrl}
                  alt="Company logo"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="space-y-2">
                <Button variant="outline" onClick={handleLogoUpload} disabled={!canEdit}>
                  Change Logo
                </Button>
                <Button
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => canEdit && setLogoUrl('')}
                  disabled={!canEdit}
                >
                  Remove Logo
                </Button>
              </div>
            </div>
          ) : (
            <div
              onClick={canEdit ? handleLogoUpload : undefined}
              className={`border-2 border-dashed rounded-lg p-8 text-center ${
                canEdit ? 'cursor-pointer hover:border-primary/50' : ''
              }`}
            >
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm font-medium">
                {canEdit ? 'Click to upload your logo' : 'No logo uploaded'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG or SVG. Max 2MB. Recommended: 512x512px
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="logo-url">Or enter logo URL</Label>
            <Input
              id="logo-url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              disabled={!canEdit}
              placeholder="https://example.com/logo.png"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave} disabled={isSaving || !canEdit}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? 'Saving...' : 'Save Logo'}
          </Button>
        </CardFooter>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Preview
          </CardTitle>
          <CardDescription>
            See how your branding will appear to clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            {/* Mock Portal Header */}
            <div
              className="p-4 flex items-center gap-4"
              style={{ backgroundColor: brandColor }}
            >
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-8 w-auto" />
              ) : (
                <div className="h-8 w-8 bg-white/20 rounded" />
              )}
              <span className="text-white font-semibold">
                {tenant?.name || 'Your Company'}
              </span>
            </div>
            {/* Mock Portal Content */}
            <div className="p-6 bg-muted/30">
              <div className="space-y-4">
                <div className="h-4 w-48 bg-muted rounded" />
                <div className="h-3 w-64 bg-muted rounded" />
                <Button
                  size="sm"
                  style={{ backgroundColor: brandColor }}
                  className="text-white"
                >
                  Sample Button
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Domain */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Custom Domain
          </CardTitle>
          <CardDescription>
            Use your own domain for the client portal (Enterprise plan only)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="domain">Domain</Label>
            <Input
              id="domain"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              placeholder="portal.yourcompany.com"
              disabled={tenant?.plan !== 'enterprise' || !canEdit}
            />
          </div>
          {tenant?.plan !== 'enterprise' && (
            <p className="text-sm text-muted-foreground">
              Upgrade to Enterprise to use a custom domain for your client portal.
            </p>
          )}
        </CardContent>
        <CardFooter>
          <Button disabled={tenant?.plan !== 'enterprise' || !canEdit}>
            Configure Domain
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
