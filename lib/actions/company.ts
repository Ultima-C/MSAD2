'use server';

import { createClient } from '@/lib/supabase/server';

export async function createCompanyAction(formData: { name: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('companies')
    .insert({
      name: formData.name,
      slug: formData.name.toLowerCase().replace(/\s+/g, '-'),
      owner_id: user.id
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}