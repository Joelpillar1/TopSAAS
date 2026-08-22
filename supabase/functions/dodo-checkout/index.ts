import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { planType, productName, customerEmail, customerName } =
      await req.json();

    // Validate input
    if (!planType || !["7days", "30days"].includes(planType)) {
      return new Response(
        JSON.stringify({ error: "Invalid plan type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Read secrets from environment
    const apiKey = Deno.env.get("api_key");
    const product7Days = Deno.env.get("product_7days");
    const product30Days = Deno.env.get("product_30days");
    const apiBaseUrl =
      Deno.env.get("api_base_url") || "https://test.dodopayments.com";

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Payment system not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const productId = planType === "7days" ? product7Days : product30Days;

    if (!productId) {
      return new Response(
        JSON.stringify({ error: `Product not configured for ${planType} plan` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build return URL — client should pass their origin or we derive it
    const origin = req.headers.get("origin") || "http://localhost:5173";
    const returnUrl = `${origin}/payment-success?plan=${planType}&product=${encodeURIComponent(productName || "")}`;

    // Create checkout session on DodoPayments
    const response = await fetch(`${apiBaseUrl}/checkouts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        product_cart: [{ product_id: productId, quantity: 1 }],
        customer: {
          email: customerEmail || undefined,
          name: customerName || undefined,
        },
        return_url: returnUrl,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error("DodoPayments API error:", response.status, errorData);
      return new Response(
        JSON.stringify({
          error: errorData?.message || `Payment session creation failed (${response.status})`,
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({
        checkout_url: data.checkout_url,
        checkout_session_id: data.checkout_session_id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
