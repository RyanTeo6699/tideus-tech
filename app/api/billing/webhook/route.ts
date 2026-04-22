import { NextResponse } from "next/server";

import {
  getStripeClient,
  hasStripeWebhookConfig,
  processStripeWebhookEvent,
  recordStripeWebhookEvent
} from "@/lib/server/billing";

export async function POST(request: Request) {
  if (!hasStripeWebhookConfig()) {
    return NextResponse.json(
      {
        received: false,
        message: "Billing webhook configuration is missing."
      },
      { status: 500 }
    );
  }

  const stripe = getStripeClient();
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const rawBody = await request.text();

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      {
        received: false,
        message: "Stripe webhook signature is missing."
      },
      { status: 400 }
    );
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("Invalid Stripe webhook signature", error);

    return NextResponse.json(
      {
        received: false,
        message: "Invalid webhook signature."
      },
      { status: 400 }
    );
  }

  try {
    const recorded = await recordStripeWebhookEvent(event);

    if (recorded.status === "duplicate") {
      await processStripeWebhookEvent(event);

      return NextResponse.json({
        received: true,
        duplicate: true
      });
    }

    await processStripeWebhookEvent(event);
  } catch (error) {
    console.error("Unable to process Stripe billing webhook", error);

    return NextResponse.json(
      {
        received: false,
        message: "Unable to process billing webhook."
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    received: true
  });
}
