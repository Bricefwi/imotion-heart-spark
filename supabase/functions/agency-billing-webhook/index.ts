// supabase/functions/agency-billing-webhook/index.ts
// Stripe webhook → sync subscriptions agences
import { serve } from "jsr:@std/http/server";
import Stripe from "npm:stripe@^17.0.0";
import { supabaseAdmin, jsonResponse, errorResponse } from "../_shared/agent-runner.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-11-20.acacia" as Parameters<typeof Stripe>[1]["apiVersion"],
});
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

const PLAN_QUOTAS: Record<string, number> = {
  starter: 20,
  pro: 100,
  agency: 999_999,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS" },
    });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) return errorResponse("Missing stripe-signature", 400);

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (e) {
    console.error("[Stripe] Invalid signature:", e);
    return errorResponse("Invalid signature", 400);
  }

  const sb = supabaseAdmin();

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const agencyId = sub.metadata?.agency_id;
        if (!agencyId) {
          console.warn("[Stripe] No agency_id in subscription metadata");
          break;
        }
        const plan = (sub.metadata?.plan ?? "starter") as string;
        const status = sub.status === "trialing" ? "trialing"
          : sub.status === "active" ? "active"
          : "past_due";

        await sb
          .from("agency_subscriptions")
          .update({
            stripe_subscription_id: sub.id,
            stripe_customer_id: typeof sub.customer === "string" ? sub.customer : (sub.customer as Stripe.Customer).id,
            plan,
            status,
            current_period_end: new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000).toISOString(),
            audits_quota: PLAN_QUOTAS[plan] ?? 5,
          })
          .eq("agency_id", agencyId);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const agencyId = sub.metadata?.agency_id;
        if (!agencyId) break;
        await sb
          .from("agency_subscriptions")
          .update({ plan: "cancelled", status: "cancelled" })
          .eq("agency_id", agencyId);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : (invoice.customer as Stripe.Customer)?.id;
        if (!customerId) break;
        await sb
          .from("agency_subscriptions")
          .update({ status: "past_due" })
          .eq("stripe_customer_id", customerId);
        break;
      }
    }

    return jsonResponse({ received: true });
  } catch (e) {
    console.error("[Stripe webhook] Error:", e);
    return errorResponse("Webhook processing failed", 500);
  }
});
