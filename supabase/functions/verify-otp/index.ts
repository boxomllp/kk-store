// supabase/functions/verify-otp/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { phone, otp, order_id } = await req.json();
    if (!phone || !otp) {
      return new Response(JSON.stringify({ success: false, error: "Missing phone or otp" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const otpHash = await sha256(otp);

    const { data: record, error: fetchError } = await supabase
      .from("otp_verifications")
      .select("*")
      .eq("phone", phone)
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError || !record) {
      return new Response(
        JSON.stringify({ success: false, error: "No pending OTP found for this number" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (new Date(record.expires_at).getTime() < Date.now()) {
      return new Response(JSON.stringify({ success: false, error: "OTP expired" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (record.otp_hash !== otpHash) {
      return new Response(JSON.stringify({ success: false, error: "Incorrect OTP. Please try again." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark OTP used
    await supabase.from("otp_verifications").update({ used: true }).eq("id", record.id);

    // Mark order verified (if order_id provided)
    if (order_id) {
      const { error: updateError } = await supabase
        .from("orders")
        .update({ verification_status: "verified" })
        .eq("id", order_id);

      if (updateError) {
        console.error("order update failed", updateError);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
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
