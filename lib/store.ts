import { create } from 'zustand'

export type AppView = 
  | 'signup'
  | 'wizard-identity'
  | 'wizard-theme'
  | 'wizard-logic'
  | 'dashboard'

export type DashboardModule = 
  | 'pipeline'
  | 'workflow'
  | 'people'
  | 'vault'
  | 'settings'

export interface User {
  id: string
  fullName: string
  email: string
  avatar?: string
}

export interface Tenant {
  companyName: string
  workspaceUrl: string
  logo?: string
  primaryColor: string
  secondaryColor: string
}

export interface OnboardingTrack {
  id: string
  name: string
  mode: 'strict' | 'parallel'
  steps: OnboardingStep[]
}

export interface OnboardingStep {
  id: string
  name: string
  description?: string
  mandatory: boolean
  attachments: string[]
}

export interface DocumentSnippet {
  id: string
  name: string
  description: string
  attachments: string[]
  instructions: string
}

export interface Client {
  id: string
  fullName: string
  email: string
  phone?: string
  status: 'to-be-hired' | 'pending' | 'hired' | 'offboarded'
  assignedTrack?: string
  tempCredentials?: { username: string; password: string }
  documents: Document[]
  createdAt: Date
  hiredAt?: Date
}

export interface Document {
  id: string
  fileName: string
  employeeId: string
  employeeName: string
  type: 'id' | 'contract' | 'certificate' | 'other'
  status: 'pending' | 'approved' | 'rejected'
  uploadedAt: Date
  url?: string
}

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  createdAt: Date
}

export interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
  status: 'active' | 'invited' | 'inactive'
}

export interface Role {
  id: string
  name: string
  description: string
  permissions: Record<string, boolean>
}

interface AppState {
  // Navigation
  currentView: AppView
  currentModule: DashboardModule
  sidebarCollapsed: boolean
  theme: 'light' | 'dark'
  
  // Auth
  user: User | null
  isAuthenticated: boolean
  
  // Tenant
  tenant: Tenant | null
  
  // Onboarding
  onboardingTracks: OnboardingTrack[]
  documentSnippets: DocumentSnippet[]
  
  // Clients
  clients: Client[]
  
  // Documents
  documents: Document[]
  
  // Notifications
  notifications: Notification[]
  
  // Team
  teamMembers: TeamMember[]
  roles: Role[]
  
  // Actions
  setCurrentView: (view: AppView) => void
  setCurrentModule: (module: DashboardModule) => void
  toggleSidebar: () => void
  toggleTheme: () => void
  setUser: (user: User | null) => void
  setTenant: (tenant: Tenant | null) => void
  updateTenant: (updates: Partial<Tenant>) => void
  addOnboardingTrack: (track: OnboardingTrack) => void
  updateOnboardingTrack: (id: string, updates: Partial<OnboardingTrack>) => void
  deleteOnboardingTrack: (id: string) => void
  addDocumentSnippet: (snippet: DocumentSnippet) => void
  addClient: (client: Client) => void
  updateClient: (id: string, updates: Partial<Client>) => void
  deleteClient: (id: string) => void
  addDocument: (doc: Document) => void
  updateDocument: (id: string, updates: Partial<Document>) => void
  addNotification: (notification: Notification) => void
  markNotificationRead: (id: string) => void
  addTeamMember: (member: TeamMember) => void
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => void
  removeTeamMember: (id: string) => void
  addRole: (role: Role) => void
  updateRole: (id: string, updates: Partial<Role>) => void
  signUp: (fullName: string, email: string) => void
  signOut: () => void
}

const generateId = () => Math.random().toString(36).substring(2, 9)

// Demo data
const demoClients: Client[] = [
  {
    id: '1',
    fullName: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    phone: '+1 555-0101',
    status: 'hired',
    documents: [],
    createdAt: new Date('2024-01-15'),
    hiredAt: new Date('2024-01-20'),
  },
  {
    id: '2',
    fullName: 'Michael Chen',
    email: 'michael.chen@email.com',
    phone: '+1 555-0102',
    status: 'pending',
    assignedTrack: '1',
    documents: [],
    createdAt: new Date('2024-02-01'),
  },
  {
    id: '3',
    fullName: 'Emily Davis',
    email: 'emily.davis@email.com',
    status: 'to-be-hired',
    assignedTrack: '1',
    tempCredentials: { username: 'emily.davis', password: 'temp123' },
    documents: [],
    createdAt: new Date('2024-02-10'),
  },
]

const demoDocuments: Document[] = [
  {
    id: '1',
    fileName: 'passport_scan.pdf',
    employeeId: '2',
    employeeName: 'Michael Chen',
    type: 'id',
    status: 'pending',
    uploadedAt: new Date('2024-02-05'),
  },
  {
    id: '2',
    fileName: 'employment_contract.pdf',
    employeeId: '1',
    employeeName: 'Sarah Johnson',
    type: 'contract',
    status: 'approved',
    uploadedAt: new Date('2024-01-18'),
  },
  {
    id: '3',
    fileName: 'certification.pdf',
    employeeId: '1',
    employeeName: 'Sarah Johnson',
    type: 'certificate',
    status: 'approved',
    uploadedAt: new Date('2024-01-19'),
  },
]

const demoNotifications: Notification[] = [
  {
    id: '1',
    title: 'New Document Submitted',
    message: 'Michael Chen submitted passport_scan.pdf',
    type: 'info',
    read: false,
    createdAt: new Date('2024-02-05T10:30:00'),
  },
  {
    id: '2',
    title: 'Onboarding Complete',
    message: 'Sarah Johnson completed all onboarding steps',
    type: 'success',
    read: true,
    createdAt: new Date('2024-01-20T14:00:00'),
  },
]

const demoTracks: OnboardingTrack[] = [
  {
    id: '1',
    name: 'Standard Onboarding',
    mode: 'strict',
    steps: [
      { id: '1', name: 'Personal Information', mandatory: true, attachments: [] },
      { id: '2', name: 'ID Verification', mandatory: true, attachments: ['ID Document'] },
      { id: '3', name: 'Contract Signing', mandatory: true, attachments: ['Employment Contract'] },
      { id: '4', name: 'Policy Acknowledgment', mandatory: false, attachments: [] },
    ],
  },
]

const demoTeamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@onboardly.com',
    role: 'Administrator',
    status: 'active',
  },
]

const demoRoles: Role[] = [
  {
    id: '1',
    name: 'Administrator',
    description: 'Full access to all features',
    permissions: {
      pipeline: true,
      workflow: true,
      people: true,
      vault: true,
      settings: true,
      team: true,
    },
  },
  {
    id: '2',
    name: 'HR Manager',
    description: 'Manage people and documents',
    permissions: {
      pipeline: true,
      workflow: true,
      people: true,
      vault: true,
      settings: false,
      team: false,
    },
  },
  {
    id: '3',
    name: 'Viewer',
    description: 'Read-only access',
    permissions: {
      pipeline: true,
      workflow: false,
      people: true,
      vault: true,
      settings: false,
      team: false,
    },
  },
]

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  currentView: 'signup',
  currentModule: 'pipeline',
  sidebarCollapsed: false,
  theme: 'light',
  user: null,
  isAuthenticated: false,
  tenant: null,
  onboardingTracks: demoTracks,
  documentSnippets: [],
  clients: demoClients,
  documents: demoDocuments,
  notifications: demoNotifications,
  teamMembers: demoTeamMembers,
  roles: demoRoles,

  // Actions
  setCurrentView: (view) => set({ currentView: view }),
  setCurrentModule: (module) => set({ currentModule: module }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light'
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', newTheme === 'dark')
    }
    return { theme: newTheme }
  }),
  
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  
  setTenant: (tenant) => set({ tenant }),
  
  updateTenant: (updates) => set((state) => ({
    tenant: state.tenant ? { ...state.tenant, ...updates } : null
  })),
  
  addOnboardingTrack: (track) => set((state) => ({
    onboardingTracks: [...state.onboardingTracks, track]
  })),
  
  updateOnboardingTrack: (id, updates) => set((state) => ({
    onboardingTracks: state.onboardingTracks.map((t) =>
      t.id === id ? { ...t, ...updates } : t
    )
  })),
  
  deleteOnboardingTrack: (id) => set((state) => ({
    onboardingTracks: state.onboardingTracks.filter((t) => t.id !== id)
  })),
  
  addDocumentSnippet: (snippet) => set((state) => ({
    documentSnippets: [...state.documentSnippets, snippet]
  })),
  
  addClient: (client) => set((state) => ({
    clients: [...state.clients, { ...client, id: generateId() }]
  })),
  
  updateClient: (id, updates) => set((state) => ({
    clients: state.clients.map((c) =>
      c.id === id ? { ...c, ...updates } : c
    )
  })),
  
  deleteClient: (id) => set((state) => ({
    clients: state.clients.filter((c) => c.id !== id)
  })),
  
  addDocument: (doc) => set((state) => ({
    documents: [...state.documents, { ...doc, id: generateId() }]
  })),
  
  updateDocument: (id, updates) => set((state) => ({
    documents: state.documents.map((d) =>
      d.id === id ? { ...d, ...updates } : d
    )
  })),
  
  addNotification: (notification) => set((state) => ({
    notifications: [{ ...notification, id: generateId() }, ...state.notifications]
  })),
  
  markNotificationRead: (id) => set((state) => ({
    notifications: state.notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    )
  })),
  
  addTeamMember: (member) => set((state) => ({
    teamMembers: [...state.teamMembers, { ...member, id: generateId() }]
  })),
  
  updateTeamMember: (id, updates) => set((state) => ({
    teamMembers: state.teamMembers.map((m) =>
      m.id === id ? { ...m, ...updates } : m
    )
  })),
  
  removeTeamMember: (id) => set((state) => ({
    teamMembers: state.teamMembers.filter((m) => m.id !== id)
  })),
  
  addRole: (role) => set((state) => ({
    roles: [...state.roles, { ...role, id: generateId() }]
  })),
  
  updateRole: (id, updates) => set((state) => ({
    roles: state.roles.map((r) =>
      r.id === id ? { ...r, ...updates } : r
    )
  })),
  
  signUp: (fullName, email) => set({
    user: { id: generateId(), fullName, email },
    isAuthenticated: true,
    currentView: 'wizard-identity',
  }),
  
  signOut: () => set({
    user: null,
    isAuthenticated: false,
    tenant: null,
    currentView: 'signup',
    currentModule: 'pipeline',
  }),
}))
