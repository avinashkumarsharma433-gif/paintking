import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface AdminRequestPayload {
  action: 'create_user' | 'update_user' | 'delete_user';
  userId?: string;
  email?: string;
  password?: string;
  fullName?: string;
  role?: string;
  roleTitle?: string;
  plant?: string;
  allowedModules?: string[];
  isActive?: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      return new Response(JSON.stringify({ error: 'Server configuration missing' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing authorization token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: callerAuth, error: callerAuthErr } = await userClient.auth.getUser();
    if (callerAuthErr || !callerAuth?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: callerProfile, error: callerProfileErr } = await adminClient
      .from('pk_portal_users')
      .select('id, email, full_name, role, is_active')
      .eq('id', callerAuth.user.id)
      .maybeSingle();

    if (
      callerProfileErr ||
      !callerProfile ||
      callerProfile.role !== 'SUPER_ADMIN' ||
      callerProfile.is_active !== true
    ) {
      return new Response(JSON.stringify({ error: 'Forbidden: Super Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = (await req.json()) as AdminRequestPayload;

    if (body.action === 'create_user') {
      const email = (body.email || '').trim().toLowerCase();
      const password = body.password || '';
      const fullName = (body.fullName || '').trim();
      const role = (body.role || 'OPERATOR').trim();
      const roleTitle = (body.roleTitle || role).trim();
      const plant = (body.plant || 'Haridwar').trim();
      const allowedModules = Array.isArray(body.allowedModules) ? body.allowedModules : [];
      const isActive = body.isActive !== false;

      if (!email || !email.endsWith('@paintking.in')) {
        return new Response(JSON.stringify({ error: 'Login email must end with @paintking.in' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (password.length < 8) {
        return new Response(JSON.stringify({ error: 'Password must be at least 8 characters' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (!fullName) {
        return new Response(JSON.stringify({ error: 'Full name is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: createdAuth, error: createErr } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, role, plant },
      });

      if (createErr || !createdAuth?.user) {
        return new Response(JSON.stringify({ error: createErr?.message || 'Failed to create auth user' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: insertedProfile, error: insertErr } = await adminClient
        .from('pk_portal_users')
        .upsert({
          id: createdAuth.user.id,
          email,
          full_name: fullName,
          role,
          role_title: roleTitle,
          plant,
          allowed_modules: allowedModules,
          is_active: isActive,
          created_by: callerProfile.email || callerProfile.full_name,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertErr) {
        await adminClient.auth.admin.deleteUser(createdAuth.user.id);
        return new Response(JSON.stringify({ error: insertErr.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ user: insertedProfile }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (body.action === 'update_user') {
      const targetId = (body.userId || '').trim();
      if (!targetId) {
        return new Response(JSON.stringify({ error: 'userId is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (targetId === callerProfile.id && body.isActive === false) {
        return new Response(JSON.stringify({ error: 'Cannot deactivate your own Super Admin account' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (body.password && body.password.trim().length > 0) {
        if (body.password.trim().length < 8) {
          return new Response(JSON.stringify({ error: 'New password must be at least 8 characters' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const { error: pwErr } = await adminClient.auth.admin.updateUserById(targetId, {
          password: body.password.trim(),
        });
        if (pwErr) {
          return new Response(JSON.stringify({ error: pwErr.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (body.fullName !== undefined) updates.full_name = body.fullName.trim();
      if (body.role !== undefined) updates.role = body.role.trim();
      if (body.roleTitle !== undefined) updates.role_title = body.roleTitle.trim();
      if (body.plant !== undefined) updates.plant = body.plant.trim();
      if (body.allowedModules !== undefined) updates.allowed_modules = body.allowedModules;
      if (body.isActive !== undefined) updates.is_active = body.isActive;

      const { data: updatedProfile, error: updErr } = await adminClient
        .from('pk_portal_users')
        .update(updates)
        .eq('id', targetId)
        .select()
        .single();

      if (updErr) {
        return new Response(JSON.stringify({ error: updErr.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ user: updatedProfile }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (body.action === 'delete_user') {
      const targetId = (body.userId || '').trim();
      if (!targetId) {
        return new Response(JSON.stringify({ error: 'userId is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (targetId === callerProfile.id) {
        return new Response(JSON.stringify({ error: 'Cannot delete your own Super Admin account' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error: delErr } = await adminClient.auth.admin.deleteUser(targetId);
      if (delErr) {
        return new Response(JSON.stringify({ error: delErr.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ deleted: true, userId: targetId }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unexpected server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
