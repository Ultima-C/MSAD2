-- Onboardly Database Schema
-- This script creates all tables, views, functions, and triggers for the Onboardly SaaS platform.
-- Includes RLS policies for multi-tenant security.

-- =====================
-- ENUMS
-- =====================

CREATE TYPE plan_tier AS ENUM ('starter', 'professional', 'enterprise');
CREATE TYPE logic_gate_mode AS ENUM ('strict', 'parallel');
CREATE TYPE client_status AS ENUM ('invited', 'in_progress', 'awaiting_review', 'complete');
CREATE TYPE task_status AS ENUM ('locked', 'pending', 'in_progress', 'complete', 'verified');
CREATE TYPE step_type AS ENUM ('signature_upload', 'form', 'file_upload', 'payment', 'scheduling', 'custom');
CREATE TYPE industry_type AS ENUM ('legal', 'creative', 'financial', 'general');
CREATE TYPE notification_type AS ENUM ('portal_link_sent', 'task_completed', 'onboarding_complete', 'reminder_sent');
CREATE TYPE ssl_status AS ENUM ('pending', 'issued', 'failed');
CREATE TYPE dns_status AS ENUM ('propagating', 'active', 'error');

-- =====================
-- SUPER ADMINS TABLE
-- =====================

CREATE TABLE IF NOT EXISTS super_admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

-- Super admins can read their own row
CREATE POLICY "super_admins_select_own" ON super_admins
  FOR SELECT USING (auth.uid() = id);

-- =====================
-- TENANTS TABLE
-- =====================

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  plan_tier plan_tier DEFAULT 'starter',
  onboarding_logic_gate logic_gate_mode DEFAULT 'parallel',
  brand_primary_color TEXT DEFAULT '#6366F1',
  brand_accent_color TEXT DEFAULT '#10B981',
  brand_logo_url TEXT,
  custom_domain TEXT,
  custom_subdomain TEXT,
  welcome_message TEXT DEFAULT 'Welcome to your onboarding portal. We''re excited to work with you!',
  reminder_enabled BOOLEAN DEFAULT true,
  reminder_delay_days INTEGER DEFAULT 3,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Tenant users can view their own tenant
CREATE POLICY "tenants_select_own" ON tenants
  FOR SELECT USING (
    id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM super_admins WHERE id = auth.uid())
  );

-- Tenant admins can update their own tenant
CREATE POLICY "tenants_update_own" ON tenants
  FOR UPDATE USING (
    id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM super_admins WHERE id = auth.uid())
  );

-- Super admins can insert tenants
CREATE POLICY "tenants_insert_super_admin" ON tenants
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM super_admins WHERE id = auth.uid())
  );

-- Super admins can delete tenants
CREATE POLICY "tenants_delete_super_admin" ON tenants
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM super_admins WHERE id = auth.uid())
  );

-- =====================
-- TENANT USERS TABLE
-- =====================

CREATE TABLE IF NOT EXISTS tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;

-- Users can see their own tenant memberships
CREATE POLICY "tenant_users_select_own" ON tenant_users
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM super_admins WHERE id = auth.uid())
  );

-- Tenant admins can manage users in their tenant
CREATE POLICY "tenant_users_insert_admin" ON tenant_users
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM super_admins WHERE id = auth.uid())
  );

CREATE POLICY "tenant_users_delete_admin" ON tenant_users
  FOR DELETE USING (
    tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM super_admins WHERE id = auth.uid())
  );

-- =====================
-- WORKFLOW TEMPLATES TABLE
-- =====================

CREATE TABLE IF NOT EXISTS workflow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  industry industry_type DEFAULT 'general',
  description TEXT,
  is_global BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;

-- Anyone can see global templates, tenant users can see their own
CREATE POLICY "workflow_templates_select" ON workflow_templates
  FOR SELECT USING (
    is_global = true
    OR tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM super_admins WHERE id = auth.uid())
  );

-- Tenant admins can create templates for their tenant
CREATE POLICY "workflow_templates_insert" ON workflow_templates
  FOR INSERT WITH CHECK (
    (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid() AND role = 'admin') AND is_global = false)
    OR (EXISTS (SELECT 1 FROM super_admins WHERE id = auth.uid()))
  );

-- Tenant admins can update their own templates
CREATE POLICY "workflow_templates_update" ON workflow_templates
  FOR UPDATE USING (
    (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid() AND role = 'admin') AND is_global = false)
    OR EXISTS (SELECT 1 FROM super_admins WHERE id = auth.uid())
  );

-- Tenant admins can delete their own templates
CREATE POLICY "workflow_templates_delete" ON workflow_templates
  FOR DELETE USING (
    (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid() AND role = 'admin') AND is_global = false)
    OR EXISTS (SELECT 1 FROM super_admins WHERE id = auth.uid())
  );

-- =====================
-- WORKFLOW STEPS TABLE
-- =====================

CREATE TABLE IF NOT EXISTS workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES workflow_templates(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  step_type step_type NOT NULL,
  is_signature_lock BOOLEAN DEFAULT false,
  required BOOLEAN DEFAULT true,
  scheduling_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;

-- Follow template visibility rules
CREATE POLICY "workflow_steps_select" ON workflow_steps
  FOR SELECT USING (
    template_id IN (
      SELECT id FROM workflow_templates WHERE 
        is_global = true
        OR tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM super_admins WHERE id = auth.uid())
    )
  );

CREATE POLICY "workflow_steps_insert" ON workflow_steps
  FOR INSERT WITH CHECK (
    template_id IN (
      SELECT id FROM workflow_templates WHERE 
        (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid() AND role = 'admin') AND is_global = false)
        OR EXISTS (SELECT 1 FROM super_admins WHERE id = auth.uid())
    )
  );

CREATE POLICY "workflow_steps_update" ON workflow_steps
  FOR UPDATE USING (
    template_id IN (
      SELECT id FROM workflow_templates WHERE 
        (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid() AND role = 'admin') AND is_global = false)
        OR EXISTS (SELECT 1 FROM super_admins WHERE id = auth.uid())
    )
  );

CREATE POLICY "workflow_steps_delete" ON workflow_steps
  FOR DELETE USING (
    template_id IN (
      SELECT id FROM workflow_templates WHERE 
        (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid() AND role = 'admin') AND is_global = false)
        OR EXISTS (SELECT 1 FROM super_admins WHERE id = auth.uid())
    )
  );

-- =====================
-- CLIENTS TABLE
-- =====================

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES workflow_templates(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  portal_token UUID DEFAULT gen_random_uuid(),
  token_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  onboarding_logic_gate_snapshot logic_gate_mode NOT NULL,
  status client_status DEFAULT 'invited',
  completion_percentage INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_clients_tenant_id ON clients(tenant_id);
CREATE INDEX idx_clients_portal_token ON clients(portal_token);
CREATE INDEX idx_clients_status ON clients(status);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Tenant users can see their clients
CREATE POLICY "clients_select_own" ON clients
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM super_admins WHERE id = auth.uid())
  );

-- Tenant users can insert clients
CREATE POLICY "clients_insert_own" ON clients
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM super_admins WHERE id = auth.uid())
  );

-- Tenant users can update their clients
CREATE POLICY "clients_update_own" ON clients
  FOR UPDATE USING (
    tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM super_admins WHERE id = auth.uid())
  );

-- Tenant admins can delete clients
CREATE POLICY "clients_delete_admin" ON clients
  FOR DELETE USING (
    tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM super_admins WHERE id = auth.uid())
  );

-- =====================
-- CLIENT TASK PROGRESS TABLE
-- =====================

CREATE TABLE IF NOT EXISTS client_task_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES workflow_steps(id) ON DELETE CASCADE,
  status task_status DEFAULT 'pending',
  submitted_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  notes TEXT,
  UNIQUE(client_id, step_id)
);

CREATE INDEX idx_client_task_progress_client_id ON client_task_progress(client_id);

ALTER TABLE client_task_progress ENABLE ROW LEVEL SECURITY;

-- Follow client visibility
CREATE POLICY "client_task_progress_select" ON client_task_progress
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM clients WHERE 
        tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM super_admins WHERE id = auth.uid())
    )
  );

CREATE POLICY "client_task_progress_insert" ON client_task_progress
  FOR INSERT WITH CHECK (
    client_id IN (
      SELECT id FROM clients WHERE 
        tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM super_admins WHERE id = auth.uid())
    )
  );

CREATE POLICY "client_task_progress_update" ON client_task_progress
  FOR UPDATE USING (
    client_id IN (
      SELECT id FROM clients WHERE 
        tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM super_admins WHERE id = auth.uid())
    )
  );

-- =====================
-- DOCUMENTS TABLE
-- =====================

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES workflow_steps(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size_bytes BIGINT,
  is_signature_document BOOLEAN DEFAULT false,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documents_tenant_id ON documents(tenant_id);
CREATE INDEX idx_documents_client_id ON documents(client_id);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Tenant users can see their documents
CREATE POLICY "documents_select_own" ON documents
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM super_admins WHERE id = auth.uid())
  );

CREATE POLICY "documents_insert_own" ON documents
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM super_admins WHERE id = auth.uid())
  );

-- =====================
-- NOTIFICATIONS TABLE
-- =====================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  type notification_type NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_tenant_id ON notifications(tenant_id);
CREATE INDEX idx_notifications_sent_at ON notifications(sent_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM super_admins WHERE id = auth.uid())
  );

CREATE POLICY "notifications_insert_own" ON notifications
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM super_admins WHERE id = auth.uid())
  );

CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (
    tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM super_admins WHERE id = auth.uid())
  );

-- =====================
-- DOMAIN REQUESTS TABLE
-- =====================

CREATE TABLE IF NOT EXISTS domain_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  requested_domain TEXT NOT NULL,
  ssl_status ssl_status DEFAULT 'pending',
  dns_status dns_status DEFAULT 'propagating',
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE domain_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "domain_requests_select" ON domain_requests
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM super_admins WHERE id = auth.uid())
  );

CREATE POLICY "domain_requests_insert" ON domain_requests
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM super_admins WHERE id = auth.uid())
  );

CREATE POLICY "domain_requests_update" ON domain_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM super_admins WHERE id = auth.uid())
  );

-- =====================
-- VIEWS
-- =====================

-- Client Pipeline View
CREATE OR REPLACE VIEW v_client_pipeline AS
SELECT 
  c.*,
  wt.name as template_name,
  wt.industry,
  EXTRACT(DAY FROM NOW() - c.created_at)::INTEGER as days_since_invited
FROM clients c
JOIN workflow_templates wt ON c.template_id = wt.id;

-- Document Vault View
CREATE OR REPLACE VIEW v_document_vault AS
SELECT 
  d.*,
  c.name as client_name,
  c.email as client_email,
  ws.title as step_title,
  ws.step_type
FROM documents d
JOIN clients c ON d.client_id = c.id
JOIN workflow_steps ws ON d.step_id = ws.id;

-- Super Admin Overview View
CREATE OR REPLACE VIEW v_super_admin_overview AS
SELECT 
  t.*,
  (SELECT COUNT(*) FROM clients WHERE tenant_id = t.id AND status IN ('invited', 'in_progress', 'awaiting_review')) as active_clients,
  (SELECT COUNT(*) FROM clients WHERE tenant_id = t.id) as total_clients
FROM tenants t;

-- =====================
-- FUNCTIONS & TRIGGERS
-- =====================

-- Function to update completion percentage
CREATE OR REPLACE FUNCTION update_client_completion()
RETURNS TRIGGER AS $$
DECLARE
  total_steps INTEGER;
  completed_steps INTEGER;
  new_percentage INTEGER;
  new_status client_status;
BEGIN
  -- Count total required steps
  SELECT COUNT(*) INTO total_steps
  FROM workflow_steps ws
  JOIN clients c ON c.template_id = ws.template_id
  WHERE c.id = NEW.client_id AND ws.required = true;
  
  -- Count completed/verified steps
  SELECT COUNT(*) INTO completed_steps
  FROM client_task_progress ctp
  JOIN workflow_steps ws ON ctp.step_id = ws.id
  WHERE ctp.client_id = NEW.client_id 
    AND ctp.status IN ('complete', 'verified')
    AND ws.required = true;
  
  -- Calculate percentage
  IF total_steps > 0 THEN
    new_percentage := (completed_steps * 100) / total_steps;
  ELSE
    new_percentage := 0;
  END IF;
  
  -- Determine new status
  IF new_percentage = 100 THEN
    new_status := 'complete';
  ELSIF new_percentage > 0 THEN
    new_status := 'in_progress';
  ELSE
    new_status := 'invited';
  END IF;
  
  -- Update client record
  UPDATE clients 
  SET 
    completion_percentage = new_percentage,
    status = new_status,
    last_activity_at = NOW(),
    completed_at = CASE WHEN new_percentage = 100 THEN NOW() ELSE completed_at END
  WHERE id = NEW.client_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for completion updates
DROP TRIGGER IF EXISTS trigger_update_completion ON client_task_progress;
CREATE TRIGGER trigger_update_completion
  AFTER INSERT OR UPDATE OF status ON client_task_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_client_completion();

-- Function to unlock steps after signature verification (strict mode)
CREATE OR REPLACE FUNCTION unlock_steps_after_signature()
RETURNS TRIGGER AS $$
DECLARE
  client_mode logic_gate_mode;
  is_sig_step BOOLEAN;
BEGIN
  -- Only process if status changed to 'verified'
  IF NEW.status = 'verified' AND (OLD.status IS NULL OR OLD.status != 'verified') THEN
    -- Check if this is a signature lock step
    SELECT ws.is_signature_lock INTO is_sig_step
    FROM workflow_steps ws
    WHERE ws.id = NEW.step_id;
    
    IF is_sig_step THEN
      -- Get client's logic gate mode
      SELECT onboarding_logic_gate_snapshot INTO client_mode
      FROM clients
      WHERE id = NEW.client_id;
      
      -- If strict mode, unlock all locked steps
      IF client_mode = 'strict' THEN
        UPDATE client_task_progress
        SET status = 'pending'
        WHERE client_id = NEW.client_id
          AND status = 'locked'
          AND step_id != NEW.step_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for unlocking steps
DROP TRIGGER IF EXISTS trigger_unlock_steps ON client_task_progress;
CREATE TRIGGER trigger_unlock_steps
  AFTER UPDATE OF status ON client_task_progress
  FOR EACH ROW
  EXECUTE FUNCTION unlock_steps_after_signature();

-- Function to create initial task progress for new clients
CREATE OR REPLACE FUNCTION create_client_task_progress()
RETURNS TRIGGER AS $$
DECLARE
  step RECORD;
  initial_status task_status;
  is_first_step BOOLEAN := true;
BEGIN
  FOR step IN 
    SELECT * FROM workflow_steps 
    WHERE template_id = NEW.template_id 
    ORDER BY step_order ASC
  LOOP
    -- Determine initial status based on logic gate mode
    IF NEW.onboarding_logic_gate_snapshot = 'strict' THEN
      IF is_first_step OR step.is_signature_lock THEN
        initial_status := 'pending';
        is_first_step := false;
      ELSE
        initial_status := 'locked';
      END IF;
    ELSE
      -- Parallel mode: all steps start as pending
      initial_status := 'pending';
    END IF;
    
    INSERT INTO client_task_progress (client_id, step_id, status)
    VALUES (NEW.id, step.id, initial_status);
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for creating task progress
DROP TRIGGER IF EXISTS trigger_create_task_progress ON clients;
CREATE TRIGGER trigger_create_task_progress
  AFTER INSERT ON clients
  FOR EACH ROW
  EXECUTE FUNCTION create_client_task_progress();

-- Function to update tenant updated_at
CREATE OR REPLACE FUNCTION update_tenant_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_tenant_updated ON tenants;
CREATE TRIGGER trigger_tenant_updated
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_tenant_timestamp();
