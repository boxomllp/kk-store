// supabase/functions/send-otp/index.ts
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

function generateOtp(length: number): string {
  const digits = new Uint32Array(length);
  crypto.getRandomValues(digits);
  return Array.from(digits, (d) => (d % 10).toString()).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const apiHomeKey = Deno.env.get("APIHOME_API_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { phone } = await req.json();
    if (!phone || !/^\d{10}$/.test(phone)) {
      return new Response(JSON.stringify({ success: false, error: "Invalid phone number" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Rate limit: max 3 requests per phone per hour ---
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await supabase
      .from("otp_verifications")
      .select("*", { count: "exact", head: true })
      .eq("phone", phone)
      .gte("created_at", oneHourAgo);

    if (countError) {
      console.error("rate limit check failed", countError);
    } else if ((count ?? 0) >= 3) {
      return new Response(
        JSON.stringify({ success: false, error: "Too many OTP requests. Try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Read OTP settings (digit length, expiry, test mode) ---
    const { data: settingsRows } = await supabase
      .from("store_settings")
      .select("key,value")
      .in("key", ["otp_digit_length", "otp_expiry_minutes", "otp_test_mode"]);

    const settings: Record<string, string> = {};
    (settingsRows ?? []).forEach((r) => (settings[r.key] = r.value));

    const otpLength = parseInt(settings.otp_digit_length ?? "4", 10);
    const expiryMinutes = parseInt(settings.otp_expiry_minutes ?? "10", 10);
    const testMode = settings.otp_test_mode === "true";

    // --- Invalidate old OTPs for this phone ---
    await supabase
      .from("otp_verifications")
      .update({ used: true })
      .eq("phone", phone)
      .eq("used", false);

    // --- Generate + hash + store new OTP ---
    const otp = testMode ? "1234".padEnd(otpLength, "4").slice(0, otpLength) : generateOtp(otpLength);
    const otpHash = await sha256(otp);
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString();

    const { error: insertError } = await supabase.from("otp_verifications").insert({
      phone,
      otp_hash: otpHash,
      expires_at: expiresAt,
      used: false,
    });

    if (insertError) {
      console.error("insert otp failed", insertError);
      return new Response(JSON.stringify({ success: false, error: "Failed to generate OTP" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Send via APIHome (skip actual SMS in test mode) ---
    if (!testMode) {
      const url = `https://apihome.in/panel/api/bulksms/?key=${apiHomeKey}&mobile=${phone}&otp=${otp}`;
      try {
        const smsRes = await fetch(url);
        if (!smsRes.ok) {
          console.error("APIHome SMS failed", await smsRes.text());
          return new Response(
            JSON.stringify({ success: false, error: "Failed to send OTP SMS" }),
            { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (smsErr) {
        console.error("APIHome fetch error", smsErr);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to send OTP SMS" }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // NEVER return the OTP itself
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
