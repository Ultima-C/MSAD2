'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useAuth, useTenant } from '@/lib/providers'
import { provisionWorkspace } from '@/lib/actions/workspace'
import type { IndustryType } from '@/lib/types/database'
import { cn } from '@/lib/utils'
import { ArrowLeft, Building2, Lock, Zap, Check, AlertCircle } from 'lucide-react'

const industries = [
  { value: 'legal', label: 'Legal', description: 'Law firms, legal services' },
  { value: 'creative', label: 'Creative', description: 'Agencies, design studios' },
  { value: 'financial', label: 'Financial', description: 'Accounting, consulting' },
  { value: 'general', label: 'General', description: 'Other industries' },
]

const logicModes = [
  { 
    value: 'strict', 
    label: 'Strict Mode', 
    icon: Lock,
    description: 'Sequential flow where tasks must be completed in order. Best for compliance-heavy industries.',
    color: 'border-amber-500 bg-amber-50 text-amber-700',
    selectedColor: 'border-amber-500 bg-amber-100 ring-2 ring-amber-500',
  },
  { 
    value: 'parallel', 
    label: 'Parallel Mode', 
    icon: Zap,
    description: 'Agile checklist where all tasks are available immediately. Best for flexible workflows.',
    color: 'border-blue-500 bg-blue-50 text-blue-700',
    selectedColor: 'border-blue-500 bg-blue-100 ring-2 ring-blue-500',
  },
]

const planTiers = [
  { 
    value: 'starter', 
    label: 'Starter', 
    price: '$49',
    description: 'Up to 10 clients/month',
    features: ['10 active clients', 'Basic templates', 'Email support'],
  },
  { 
    value: 'professional', 
    label: 'Professional', 
    price: '$149',
    description: 'Up to 50 clients/month',
    features: ['50 active clients', 'Custom templates', 'Priority support', 'Custom branding'],
    recommended: true,
  },
  { 
    value: 'enterprise', 
    label: 'Enterprise', 
    price: '$399',
    description: 'Unlimited clients',
    features: ['Unlimited clients', 'API access', 'Dedicated support', 'SSO & advanced security'],
  },
]

export default function NewWorkspacePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { refreshTenants } = useTenant()
  const supabase = createClient()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCheckingSlug, setIsCheckingSlug] = useState(false)
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [slugError, setSlugError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    industry: 'general',
    logicMode: 'strict',
    plan: 'starter',
  })

  // Auto-generate slug from name
  useEffect(() => {
    if (formData.name) {
      const generatedSlug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 30)
      setFormData(prev => ({ ...prev, slug: generatedSlug }))
    }
  }, [formData.name])

  // Check slug availability with debounce
  useEffect(() => {
    if (!formData.slug || formData.slug.length < 3) {
      setSlugAvailable(null)
      setSlugError(null)
      return
    }

    const checkSlug = async () => {
      setIsCheckingSlug(true)
      setSlugError(null)
      
      try {
        const { data, error } = await supabase
          .from('tenants')
          .select('id')
          .eq('slug', formData.slug)
          .maybeSingle()

        if (error) throw error
        setSlugAvailable(!data)
        if (data) {
          setSlugError('This subdomain is already taken')
        }
      } catch (error) {
        console.error('Error checking slug:', error)
        setSlugAvailable(null)
      } finally {
        setIsCheckingSlug(false)
      }
    }

    const timeoutId = setTimeout(checkSlug, 500)
    return () => clearTimeout(timeoutId)
  }, [formData.slug, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast.error('You must be logged in')
      return
    }

    if (!formData.name.trim()) {
      toast.error('Please enter a workspace name')
      return
    }

    if (!formData.slug || formData.slug.length < 3) {
      toast.error('Subdomain must be at least 3 characters')
      return
    }

    if (!slugAvailable) {
      toast.error('Please choose a different subdomain')
      return
    }

    setIsSubmitting(true)

    try {
      // Use the server action which handles revalidation
      const result = await provisionWorkspace({
        name: formData.name.trim(),
        slug: formData.slug,
        industry: formData.industry as IndustryType,
        default_logic_mode: formData.logicMode as 'strict' | 'parallel',
        brand_color: '#2563EB',
      })

      if (!result.success) {
        toast.error('Error creating workspace', { description: result.error })
        return
      }

      toast.success('Workspace created successfully!', {
        description: 'Redirecting to your new workspace...',
      })

      // Refresh tenants to include the new one in the sidebar
      // Pass isNewWorkspace: true to enable retry logic for RLS propagation
      await refreshTenants({ isNewWorkspace: true })

      // Small delay to show success
      await new Promise(resolve => setTimeout(resolve, 500))
      
      router.push('/dashboard')
      router.refresh()
    } catch (error: unknown) {
      console.error('Error creating workspace:', error)
      const message = error instanceof Error ? error.message : 'Failed to create workspace'
      toast.error('Error creating workspace', { description: message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold">Create New Workspace</h1>
        <p className="text-muted-foreground mt-2">
          Set up a new workspace to manage your client onboarding
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Workspace Details
            </CardTitle>
            <CardDescription>
              Basic information about your workspace
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Workspace Name</Label>
              <Input
                id="name"
                placeholder="e.g., Acme Law Firm"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Subdomain</Label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    id="slug"
                    placeholder="acme-law"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    className={cn(
                      "pr-10",
                      slugAvailable === true && "border-green-500 focus-visible:ring-green-500",
                      slugAvailable === false && "border-destructive focus-visible:ring-destructive"
                    )}
                    required
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isCheckingSlug && <Spinner className="w-4 h-4" />}
                    {!isCheckingSlug && slugAvailable === true && (
                      <Check className="w-4 h-4 text-green-500" />
                    )}
                    {!isCheckingSlug && slugAvailable === false && (
                      <AlertCircle className="w-4 h-4 text-destructive" />
                    )}
                  </div>
                </div>
                <span className="text-muted-foreground text-sm">.onboardly.io</span>
              </div>
              {slugError && (
                <p className="text-sm text-destructive">{slugError}</p>
              )}
              {slugAvailable && formData.slug && (
                <p className="text-sm text-green-600">
                  Your workspace will be available at {formData.slug}.onboardly.io
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Select
                value={formData.industry}
                onValueChange={(value) => setFormData({ ...formData, industry: value })}
              >
                <SelectTrigger id="industry">
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {industries.map((industry) => (
                    <SelectItem key={industry.value} value={industry.value}>
                      <div>
                        <span className="font-medium">{industry.label}</span>
                        <span className="text-muted-foreground ml-2 text-sm">
                          - {industry.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Logic Mode Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Onboarding Mode (Gatekeeper Engine)</CardTitle>
            <CardDescription>
              Choose how clients progress through their onboarding tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {logicModes.map((mode) => {
                const Icon = mode.icon
                const isSelected = formData.logicMode === mode.value
                return (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, logicMode: mode.value })}
                    className={cn(
                      "relative p-4 rounded-lg border-2 text-left transition-all",
                      isSelected ? mode.selectedColor : "border-border hover:border-muted-foreground/50"
                    )}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3">
                        <Check className="w-5 h-5" />
                      </div>
                    )}
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center mb-3",
                      isSelected ? mode.color : "bg-muted"
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold mb-1">{mode.label}</h3>
                    <p className="text-sm text-muted-foreground">{mode.description}</p>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Plan Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Plan</CardTitle>
            <CardDescription>
              Choose the plan that best fits your needs. You can upgrade anytime.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {planTiers.map((plan) => {
                const isSelected = formData.plan === plan.value
                return (
                  <button
                    key={plan.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, plan: plan.value })}
                    className={cn(
                      "relative p-4 rounded-lg border-2 text-left transition-all",
                      isSelected 
                        ? "border-primary bg-primary/5 ring-2 ring-primary" 
                        : "border-border hover:border-muted-foreground/50",
                      plan.recommended && !isSelected && "border-primary/50"
                    )}
                  >
                    {plan.recommended && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded-full">
                          Recommended
                        </span>
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute top-3 right-3">
                        <Check className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    <div className="mb-3">
                      <h3 className="font-semibold">{plan.label}</h3>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-2xl font-bold">{plan.price}</span>
                        <span className="text-muted-foreground text-sm">/month</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>
                    <ul className="space-y-1">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="text-sm flex items-center gap-2">
                          <Check className="w-3 h-3 text-primary" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting || !slugAvailable}>
            {isSubmitting ? (
              <>
                <Spinner className="w-4 h-4 mr-2" />
                Creating Workspace...
              </>
            ) : (
              'Create Workspace'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
