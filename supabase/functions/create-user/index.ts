import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, password, full_name, role, phone, department, position, team_id, manager_id } = await req.json();

    // SECURITY: Block admin creation via API
    if (role === 'admin') {
      return new Response(JSON.stringify({ error: 'Criação de administrador não é permitida pelo sistema' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!email || !password || !full_name) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: userData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (signUpError) {
      return new Response(JSON.stringify({ error: signUpError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = userData.user.id;

    // Update profile with extra fields
    const profileUpdate: Record<string, any> = { full_name, email };
    if (phone) profileUpdate.phone = phone;
    if (department) profileUpdate.department = department;
    if (position) profileUpdate.position = position;
    if (team_id) profileUpdate.team_id = team_id;
    if (manager_id) profileUpdate.manager_id = manager_id;
    
    await supabaseAdmin.from('profiles').update(profileUpdate).eq('user_id', userId);

    // Update role
    if (role && role !== 'solicitante') {
      await supabaseAdmin.from('user_roles').update({ role }).eq('user_id', userId);
    }

    // Apply role-defaults permissions (gestor / colaborador) from DB
    if (role === 'gestor' || role === 'colaborador') {
      const { data: defaults } = await supabaseAdmin
        .from('role_defaults')
        .select('permissions')
        .eq('role', role)
        .maybeSingle();
      const perms = (defaults?.permissions as Record<string, boolean>) || {};
      if (Object.keys(perms).length > 0) {
        await supabaseAdmin.from('permissions').update(perms).eq('user_id', userId);
      }
    }

    return new Response(JSON.stringify({ success: true, user_id: userId }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
