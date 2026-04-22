import "server-only";

import Stripe from "stripe";
import type { User } from "@supabase/supabase-js";

import type { Database, Json, Tables } from "@/lib/database.types";
import type { ConsumerPlanStatus } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

export type BillingCheckoutMetadata = {
  sourceSurface: string;
  gatedCapability?: string | null;
  caseId?: string | null;
  useCase?: string | null;
};

export type BillingSyncResult = {
  userId: string;
  providerCustomerId: string;
  providerSubscriptionId: string;
  planStatus: ConsumerPlanStatus;
};

let stripeClient: Stripe | null = null;

export function hasStripeBillingConfig() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRO_PRICE_ID);
}

export function hasStripeWebhookConfig() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Stripe secret key is missing.");
  }

  stripeClient ??= new Stripe(secretKey);
  return stripeClient;
}

export async function createConsumerProCheckoutSession({
  user,
  profile,
  requestUrl,
  metadata
}: {
  user: User;
  profile: Tables<"profiles"> | null;
  requestUrl: string;
  metadata: BillingCheckoutMetadata;
}) {
  const priceId = process.env.STRIPE_PRO_PRICE_ID;

  if (!priceId) {
    throw new Error("Stripe Pro price id is missing.");
  }

  const stripe = getStripeClient();
  const admin = createAdminClient();
  const customerId = await getOrCreateStripeCustomer({
    stripe,
    admin,
    user,
    profile
  });
  const appUrl = getAppUrl(requestUrl);

  return stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: user.id,
    line_items: [
      {
        price: priceId,
        quantity: 1
      }
    ],
    success_url: `${appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/billing/cancel`,
    metadata: {
      userId: user.id,
      requestedPlan: "pro",
      sourceSurface: metadata.sourceSurface,
      gatedCapability: metadata.gatedCapability ?? "",
      caseId: metadata.caseId ?? "",
      useCase: metadata.useCase ?? ""
    },
    subscription_data: {
      metadata: {
        userId: user.id,
        requestedPlan: "pro",
        sourceSurface: metadata.sourceSurface,
        gatedCapability: metadata.gatedCapability ?? "",
        caseId: metadata.caseId ?? "",
        useCase: metadata.useCase ?? ""
      }
    },
    allow_promotion_codes: true
  });
}

export async function syncStripeCheckoutSessionForUser({
  sessionId,
  userId
}: {
  sessionId: string;
  userId: string;
}) {
  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription"]
  });
  const sessionUserId = session.client_reference_id || session.metadata?.userId || null;

  if (sessionUserId !== userId) {
    return null;
  }

  const checkoutSubscription = session.subscription;
  const subscriptionId = readStripeId(checkoutSubscription);

  if (!subscriptionId) {
    return null;
  }

  const subscription =
    checkoutSubscription && typeof checkoutSubscription === "object" && checkoutSubscription.object === "subscription"
      ? checkoutSubscription
      : await stripe.subscriptions.retrieve(subscriptionId);

  return syncStripeSubscription(subscription, {
    eventId: `checkout-session:${session.id}`,
    fallbackUserId: userId
  });
}

export async function recordStripeWebhookEvent(event: Stripe.Event) {
  const admin = createAdminClient();
  const eventObject = readStripeObjectRecord(event.data.object);
  const providerCustomerId = readStripeId(eventObject.customer);
  const providerSubscriptionId = readStripeId(eventObject.subscription) || readStripeId(eventObject.id);
  const { error } = await admin.from("billing_events").insert({
    provider: "stripe",
    provider_event_id: event.id,
    event_type: event.type,
    provider_customer_id: providerCustomerId,
    provider_subscription_id: providerSubscriptionId,
    payload: event as unknown as Json,
    metadata: {
      livemode: event.livemode
    }
  });

  if (!error) {
    return {
      status: "inserted" as const,
      providerCustomerId,
      providerSubscriptionId
    };
  }

  if (error.code === "23505") {
    return {
      status: "duplicate" as const,
      providerCustomerId,
      providerSubscriptionId
    };
  }

  throw error;
}

export async function processStripeWebhookEvent(event: Stripe.Event) {
  const stripe = getStripeClient();
  let syncResult: BillingSyncResult | null = null;

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const subscriptionId = readStripeId(session.subscription);

      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        syncResult = await syncStripeSubscription(subscription, {
          eventId: event.id,
          fallbackUserId: session.client_reference_id || session.metadata?.userId || null
        });
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      syncResult = await syncStripeSubscription(subscription, {
        eventId: event.id,
        fallbackUserId: subscription.metadata.userId || null
      });
      break;
    }
    case "invoice.payment_failed":
    case "invoice.payment_succeeded": {
      const invoice = readStripeObjectRecord(event.data.object);
      const subscriptionId = readStripeId(invoice.subscription);

      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        syncResult = await syncStripeSubscription(subscription, {
          eventId: event.id,
          fallbackUserId: readMetadataString(invoice.metadata, "userId")
        });
      }
      break;
    }
    default:
      break;
  }

  await markStripeWebhookEventProcessed(event, syncResult);
  return syncResult;
}

async function getOrCreateStripeCustomer({
  stripe,
  admin,
  user,
  profile
}: {
  stripe: Stripe;
  admin: AdminClient;
  user: User;
  profile: Tables<"profiles"> | null;
}) {
  if (profile?.billing_provider === "stripe" && profile.billing_customer_id) {
    return profile.billing_customer_id;
  }

  const customer = await stripe.customers.create({
    email: user.email ?? profile?.email ?? undefined,
    name:
      profile?.full_name ||
      (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : undefined),
    metadata: {
      userId: user.id,
      source: "tideus-pro-checkout"
    }
  });

  const { error } = await admin
    .from("profiles")
    .update({
      billing_provider: "stripe",
      billing_customer_id: customer.id,
      consumer_plan_source: profile?.consumer_plan_source ?? "stripe-checkout-started"
    })
    .eq("user_id", user.id);

  if (error) {
    throw error;
  }

  return customer.id;
}

async function syncStripeSubscription(
  subscription: Stripe.Subscription,
  options: {
    eventId: string;
    fallbackUserId?: string | null;
  }
): Promise<BillingSyncResult> {
  const admin = createAdminClient();
  const providerCustomerId = readStripeId(subscription.customer);
  const userId = await resolveSubscriptionUserId(admin, subscription, providerCustomerId, options.fallbackUserId);
  const planStatus = mapStripeSubscriptionStatus(subscription.status);
  const period = readSubscriptionPeriod(subscription);
  const priceId = subscription.items.data[0]?.price?.id ?? null;
  const currentPeriodEnd = period.currentPeriodEnd ? timestampToIso(period.currentPeriodEnd) : null;
  const currentPeriodStart = period.currentPeriodStart ? timestampToIso(period.currentPeriodStart) : null;
  const canceledAt = subscription.canceled_at ? timestampToIso(subscription.canceled_at) : null;
  const trialEnd = subscription.trial_end ? timestampToIso(subscription.trial_end) : null;

  const subscriptionRecord: Database["public"]["Tables"]["billing_subscriptions"]["Insert"] = {
    user_id: userId,
    provider: "stripe",
    provider_customer_id: providerCustomerId,
    provider_subscription_id: subscription.id,
    provider_price_id: priceId,
    consumer_plan_tier: "pro",
    status: planStatus,
    current_period_start: currentPeriodStart,
    current_period_end: currentPeriodEnd,
    cancel_at_period_end: subscription.cancel_at_period_end,
    canceled_at: canceledAt,
    trial_end: trialEnd,
    last_event_id: options.eventId,
    metadata: {
      stripeStatus: subscription.status,
      livemode: subscription.livemode,
      cancelAtPeriodEnd: subscription.cancel_at_period_end
    }
  };

  const { error: upsertError } = await admin
    .from("billing_subscriptions")
    .upsert(subscriptionRecord, {
      onConflict: "provider,provider_subscription_id"
    });

  if (upsertError) {
    throw upsertError;
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({
      consumer_plan_tier: "pro",
      consumer_plan_status: planStatus,
      consumer_plan_source: "stripe",
      consumer_plan_activated_at: planStatus === "active" || planStatus === "trialing" ? new Date().toISOString() : undefined,
      consumer_plan_current_period_end: currentPeriodEnd,
      billing_provider: "stripe",
      billing_customer_id: providerCustomerId,
      billing_subscription_id: subscription.id,
      billing_last_event_id: options.eventId
    })
    .eq("user_id", userId);

  if (profileError) {
    throw profileError;
  }

  return {
    userId,
    providerCustomerId,
    providerSubscriptionId: subscription.id,
    planStatus
  };
}

async function resolveSubscriptionUserId(
  admin: AdminClient,
  subscription: Stripe.Subscription,
  providerCustomerId: string,
  fallbackUserId?: string | null
) {
  const metadataUserId = subscription.metadata.userId || fallbackUserId;

  if (metadataUserId) {
    return metadataUserId;
  }

  const { data, error } = await admin
    .from("profiles")
    .select("user_id")
    .eq("billing_provider", "stripe")
    .eq("billing_customer_id", providerCustomerId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.user_id) {
    throw new Error("Unable to resolve subscription owner.");
  }

  return data.user_id;
}

async function markStripeWebhookEventProcessed(event: Stripe.Event, result: BillingSyncResult | null) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("billing_events")
    .update({
      user_id: result?.userId ?? undefined,
      provider_customer_id: result?.providerCustomerId ?? undefined,
      provider_subscription_id: result?.providerSubscriptionId ?? undefined,
      processed_at: new Date().toISOString(),
      metadata: {
        livemode: event.livemode,
        processed: true,
        planStatus: result?.planStatus ?? null
      }
    })
    .eq("provider", "stripe")
    .eq("provider_event_id", event.id);

  if (error) {
    throw error;
  }
}

function mapStripeSubscriptionStatus(status: Stripe.Subscription.Status): ConsumerPlanStatus {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "canceled":
      return "canceled";
    case "incomplete_expired":
      return "expired";
    case "paused":
      return "paused";
    case "incomplete":
    case "past_due":
    case "unpaid":
      return "inactive";
  }
}

function readSubscriptionPeriod(subscription: Stripe.Subscription) {
  const firstItem = subscription.items.data[0];

  return {
    currentPeriodStart: firstItem?.current_period_start ?? null,
    currentPeriodEnd: firstItem?.current_period_end ?? null
  };
}

function getAppUrl(requestUrl: string) {
  const configured = process.env.NEXT_PUBLIC_APP_URL;

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const url = new URL(requestUrl);
  return url.origin;
}

function timestampToIso(value: number) {
  return new Date(value * 1000).toISOString();
}

function readStripeId(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object" && "id" in value && typeof (value as { id?: unknown }).id === "string") {
    return (value as { id: string }).id;
  }

  return "";
}

function readMetadataString(value: unknown, key: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const metadataValue = (value as Record<string, unknown>)[key];
  return typeof metadataValue === "string" && metadataValue.trim() ? metadataValue.trim() : null;
}

function readStripeObjectRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}
