// app/api/stripe/route.ts
// Installation: npm install stripe @stripe/stripe-js

import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialisez avec votre clé secrète Stripe (utilisez les variables d'environnement)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_YOUR_TEST_KEY', {
  apiVersion: '2024-06-20',
});

// Configuration des plans
const PLANS = {
  starter: {
    priceId: 'price_starter', // Créez ces prix dans votre dashboard Stripe
    name: 'Starter',
    price: 19,
    features: ['1 Bot', 'DCA Strategy', 'Support email']
  },
  pro: {
    priceId: 'price_pro',
    name: 'Pro',
    price: 49,
    features: ['5 Bots', 'All Strategies', 'Priority Support', 'API Access']
  },
  enterprise: {
    priceId: 'price_enterprise',
    name: 'Enterprise',
    price: 149,
    features: ['Unlimited Bots', 'Custom Strategies', 'Dedicated Support']
  }
};

// Endpoint pour créer une session de checkout
export async function POST(request: Request) {
  try {
    const { planId, userEmail } = await request.json();
    
    if (!PLANS[planId as keyof typeof PLANS]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const plan = PLANS[planId as keyof typeof PLANS];

    // Créer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `CryptoBot Pro - ${plan.name}`,
              description: plan.features.join(', '),
            },
            unit_amount: plan.price * 100, // Stripe utilise les centimes
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing`,
      customer_email: userEmail,
      subscription_data: {
        trial_period_days: 7, // 7 jours d'essai gratuit
      },
      metadata: {
        planId,
        userEmail,
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Stripe error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// Webhook pour gérer les événements Stripe
export async function webhook(request: Request) {
  const sig = request.headers.get('stripe-signature')!;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  
  try {
    const body = await request.text();
    const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
        
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
        
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(event.data.object as Stripe.Subscription);
        break;
        
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error.message);
    return NextResponse.json(
      { error: `Webhook Error: ${error.message}` },
      { status: 400 }
    );
  }
}

// Handlers pour les différents événements
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userEmail = session.customer_email;
  const planId = session.metadata?.planId;
  
  // Mettre à jour votre base de données
  console.log(`New subscription for ${userEmail} - Plan: ${planId}`);
  
  // TODO: Activer le compte utilisateur dans votre DB
  // await updateUserSubscription(userEmail, planId, session.subscription);
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Subscription created:', subscription.id);
  // TODO: Créer l'entrée dans votre DB
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Subscription updated:', subscription.id);
  // TODO: Mettre à jour le plan dans votre DB
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  console.log('Subscription canceled:', subscription.id);
  // TODO: Désactiver les bots de l'utilisateur
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Payment succeeded:', invoice.id);
  // TODO: Envoyer email de confirmation
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Payment failed:', invoice.id);
  // TODO: Envoyer email d'alerte et suspendre les bots après 3 échecs
}

// ===== COMPOSANT REACT POUR LE CHECKOUT =====
// components/StripeCheckout.tsx

export const StripeCheckoutButton = ({ planId, userEmail }: { planId: string; userEmail: string }) => {
  const handleCheckout = async () => {
    try {
      const response = await fetch('/api/stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId, userEmail }),
      });

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg"
    >
      S'abonner
    </button>
  );
};

// ===== PORTAL CLIENT POUR GÉRER L'ABONNEMENT =====
export async function createCustomerPortalSession(customerId: string) {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_URL}/dashboard/settings`,
    });
    
    return session.url;
  } catch (error) {
    console.error('Portal error:', error);
    return null;
  }
}