'use client'

import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import { useTenant } from '@/lib/providers'
import type { Client, ClientWithTasks, CreateClientInput } from '@/lib/types/database'

const supabase = createClient()

export function useClients() {
  const { tenant } = useTenant()

  const { data, error, isLoading, mutate } = useSWR(
    tenant ? `clients-${tenant.id}` : null,
    async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('tenant_id', tenant!.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Client[]
    },
    {
      revalidateOnFocus: true,
    }
  )

  const createClient = async (input: CreateClientInput) => {
    const { data: newClient, error } = await supabase
      .from('clients')
      .insert(input)
      .select()
      .single()

    if (error) {
      return { data: null, error: error.message }
    }

    await mutate()
    return { data: newClient as Client, error: null }
  }

  const updateClient = async (id: string, updates: Partial<Client>) => {
    const { error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)

    if (error) {
      return { error: error.message }
    }

    await mutate()
    return { error: null }
  }

  const deleteClient = async (id: string) => {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)

    if (error) {
      return { error: error.message }
    }

    await mutate()
    return { error: null }
  }

  const getClientWithTasks = async (clientId: string): Promise<ClientWithTasks | null> => {
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single()

    if (clientError || !client) return null

    const { data: tasks } = await supabase
      .from('client_tasks')
      .select('*')
      .eq('client_id', clientId)
      .order('step_order', { ascending: true })

    return {
      ...client,
      tasks: tasks || [],
    } as ClientWithTasks
  }

  return {
    clients: data || [],
    isLoading,
    error: error?.message,
    createClient,
    updateClient,
    deleteClient,
    getClientWithTasks,
    refresh: mutate,
  }
}

export function useClient(clientId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    clientId ? `client-${clientId}` : null,
    async () => {
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId!)
        .single()

      if (clientError) throw clientError

      const { data: tasks } = await supabase
        .from('client_tasks')
        .select('*')
        .eq('client_id', clientId!)
        .order('step_order', { ascending: true })

      return {
        ...client,
        tasks: tasks || [],
      } as ClientWithTasks
    },
    {
      revalidateOnFocus: true,
    }
  )

  return {
    client: data || null,
    isLoading,
    error: error?.message,
    refresh: mutate,
  }
}
