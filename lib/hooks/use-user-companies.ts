import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useUserCompanies() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchCompanies() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('companies')
        .select(`
          id,
          name,
          slug,
          team_members!inner(user_id)
        `)
        .eq('team_members.user_id', user.id);

      setCompanies(data || []);
      setLoading(false);
    }
    fetchCompanies();
  }, [supabase]);

  return { companies, loading };
}