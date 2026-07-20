'use client'

import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import { useTenant } from '@/lib/providers'
import type { Notification } from '@/lib/types/database'

const supabase = createClient()

export function useNotifications() {
  const { tenant } = useTenant()

  const { data, error, isLoading, mutate } = useSWR(
    tenant ? `notifications-${tenant.id}` : null,
    async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('tenant_id', tenant!.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return data as Notification[]
    },
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
    }
  )

  const unreadCount = data?.filter(n => !n.is_read).length || 0

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)

    if (error) {
      return { error: error.message }
    }

    await mutate()
    return { error: null }
  }

  const markAllAsRead = async () => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('tenant_id', tenant!.id)
      .eq('is_read', false)

    if (error) {
      return { error: error.message }
    }

    await mutate()
    return { error: null }
  }

  const deleteNotification = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)

    if (error) {
      return { error: error.message }
    }

    await mutate()
    return { error: null }
  }

  return {
    notifications: data || [],
    unreadCount,
    isLoading,
    error: error?.message,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: mutate,
  }
}
