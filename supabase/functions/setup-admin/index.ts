// supabase/functions/setup-admin/index.ts
// One-time function: creates the FIRST admin account. Refuses if an admin already exists.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { email, password, setup_secret } = await req.json();

    // Extra safety: require a one-time setup secret set as an env var,
    // so this endpoint can't be hit by strangers even once.
    const expectedSecret = Deno.env.get("SETUP_ADMIN_SECRET");
    if (expectedSecret && setup_secret !== expectedSecret) {
      return new Response(JSON.stringify({ success: false, error: "Invalid setup secret" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Refuse if any admin already exists
    const { count } = await supabase
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin");

    if ((count ?? 0) > 0) {
      return new Response(
        JSON.stringify({ success: false, error: "An admin account already exists" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!email || !password || password.length < 8) {
      return new Response(
        JSON.stringify({ success: false, error: "Valid email and password (min 8 chars) required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError || !userData?.user) {
      console.error("createUser failed", createError);
      return new Response(
        JSON.stringify({ success: false, error: createError?.message ?? "Failed to create user" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({ user_id: userData.user.id, role: "admin" });

    if (roleError) {
      console.error("role insert failed", roleError);
      return new Response(JSON.stringify({ success: false, error: "Failed to assign admin role" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, user_id: userData.user.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ success: false, error: "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
