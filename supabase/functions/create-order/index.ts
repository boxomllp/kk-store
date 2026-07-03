// supabase/functions/create-order/index.ts
// Creates an order with an atomic, sequential order_number (KK10091, KK10092, ...)
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

    const body = await req.json();
    const {
      product_id,
      product_name,
      product_price,
      variant,
      customer_name,
      phone,
      address_line1,
      address_line2,
      landmark,
      city,
      pincode,
      state,
    } = body;

    if (!customer_name || !phone || !address_line1) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Atomically increment the order counter using a Postgres function
    // to avoid race conditions under concurrent order volume.
    const { data: counterData, error: counterError } = await supabase
      .rpc("increment_order_counter");

    if (counterError) {
      console.error("counter error", counterError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to generate order number" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const orderNumber = `KK${counterData}`;

    const { data: order, error: insertError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        product_id,
        product_name,
        product_price,
        variant,
        customer_name,
        phone,
        address_line1,
        address_line2,
        landmark,
        city,
        pincode,
        state,
        status: "pending",
        verification_status: "unverified",
      })
      .select()
      .single();

    if (insertError) {
      console.error("insert error", insertError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to create order" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ success: true, order }), {
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
