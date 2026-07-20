'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useTenant } from '@/lib/providers/tenant-provider'
import {
  CreditCard,
  CheckCircle2,
  ArrowUpRight,
  Download,
  Users,
  Workflow,
  HardDrive,
} from 'lucide-react'

const plans = [
  {
    name: 'Starter',
    value: 'starter',
    price: 29,
    description: 'Perfect for small teams getting started',
    features: [
      '5 team members',
      '50 active clients',
      '3 workflow templates',
      '1GB file storage',
      'Email support',
    ],
  },
  {
    name: 'Professional',
    value: 'pro',
    price: 79,
    description: 'For growing businesses with more needs',
    features: [
      '15 team members',
      '250 active clients',
      '10 workflow templates',
      '10GB file storage',
      'Priority support',
      'Custom branding',
      'API access',
    ],
    popular: true,
  },
  {
    name: 'Enterprise',
    value: 'enterprise',
    price: 199,
    description: 'For large organizations with custom needs',
    features: [
      'Unlimited team members',
      'Unlimited clients',
      'Unlimited workflows',
      '100GB file storage',
      '24/7 phone support',
      'Custom domain',
      'SSO/SAML',
      'Dedicated account manager',
    ],
  },
]

const mockInvoices = [
  { id: 'INV-001', date: 'Apr 1, 2024', amount: 79, status: 'paid' },
  { id: 'INV-002', date: 'Mar 1, 2024', amount: 79, status: 'paid' },
  { id: 'INV-003', date: 'Feb 1, 2024', amount: 79, status: 'paid' },
]

export default function BillingSettingsPage() {
  const { currentTenant, can } = useTenant()
  const [isUpgrading, setIsUpgrading] = useState(false)

  const currentPlan = plans.find(p => p.value === currentTenant?.plan) || plans[0]

  // Mock usage data
  const usage = {
    teamMembers: { used: 8, limit: currentPlan.value === 'enterprise' ? Infinity : currentPlan.value === 'pro' ? 15 : 5 },
    clients: { used: 42, limit: currentPlan.value === 'enterprise' ? Infinity : currentPlan.value === 'pro' ? 250 : 50 },
    storage: { used: 2.4, limit: currentPlan.value === 'enterprise' ? 100 : currentPlan.value === 'pro' ? 10 : 1 },
  }

  const handleUpgrade = async (planValue: string) => {
    setIsUpgrading(true)
    // In a real app, this would redirect to Stripe checkout
    console.log('Upgrading to:', planValue)
    setTimeout(() => setIsUpgrading(false), 1000)
  }

  const handleManageBilling = () => {
    // In a real app, this would redirect to Stripe billing portal
    console.log('Opening billing portal')
  }

  const canManageBilling = can('billing:manage')

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>
                You are currently on the {currentPlan.name} plan
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              ${currentPlan.price}/mo
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Usage Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Team Members
                </span>
                <span>
                  {usage.teamMembers.used} / {usage.teamMembers.limit === Infinity ? '∞' : usage.teamMembers.limit}
                </span>
              </div>
              <Progress
                value={usage.teamMembers.limit === Infinity ? 0 : (usage.teamMembers.used / usage.teamMembers.limit) * 100}
                className="h-2"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Workflow className="h-4 w-4 text-muted-foreground" />
                  Active Clients
                </span>
                <span>
                  {usage.clients.used} / {usage.clients.limit === Infinity ? '∞' : usage.clients.limit}
                </span>
              </div>
              <Progress
                value={usage.clients.limit === Infinity ? 0 : (usage.clients.used / usage.clients.limit) * 100}
                className="h-2"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  Storage
                </span>
                <span>
                  {usage.storage.used}GB / {usage.storage.limit}GB
                </span>
              </div>
              <Progress
                value={(usage.storage.used / usage.storage.limit) * 100}
                className="h-2"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          {canManageBilling && (
            <Button variant="outline" onClick={handleManageBilling}>
              <CreditCard className="mr-2 h-4 w-4" />
              Manage Billing
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Available Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
          <CardDescription>
            Choose a plan that fits your needs. Upgrade or downgrade anytime.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((plan) => {
              const isCurrent = plan.value === currentTenant?.plan
              return (
                <div
                  key={plan.value}
                  className={`relative rounded-lg border p-6 ${
                    plan.popular ? 'border-primary shadow-md' : ''
                  } ${isCurrent ? 'bg-muted/50' : ''}`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-2 right-4">Most Popular</Badge>
                  )}
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">${plan.price}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    <ul className="space-y-2">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    {canManageBilling && (
                      <Button
                        className="w-full"
                        variant={isCurrent ? 'outline' : plan.popular ? 'default' : 'outline'}
                        disabled={isCurrent || isUpgrading}
                        onClick={() => handleUpgrade(plan.value)}
                      >
                        {isCurrent ? (
                          'Current Plan'
                        ) : (
                          <>
                            {plan.value === 'enterprise' ? 'Contact Sales' : 'Upgrade'}
                            <ArrowUpRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>
            View and download your past invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {mockInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-4 rounded-lg border"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-medium">{invoice.id}</p>
                    <p className="text-sm text-muted-foreground">{invoice.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="secondary" className="capitalize">
                    {invoice.status}
                  </Badge>
                  <span className="font-medium">${invoice.amount}.00</span>
                  <Button variant="ghost" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Method
          </CardTitle>
          <CardDescription>
            Manage your payment information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded flex items-center justify-center text-white text-xs font-bold">
                VISA
              </div>
              <div>
                <p className="font-medium">•••• •••• •••• 4242</p>
                <p className="text-sm text-muted-foreground">Expires 12/25</p>
              </div>
            </div>
            {canManageBilling && (
              <Button variant="outline" size="sm" onClick={handleManageBilling}>
                Update
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
