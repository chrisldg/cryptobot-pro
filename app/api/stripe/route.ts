// app/api/stripe/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

// LIMITES DE SÉCURITÉ
const SECURITY_LIMITS = {
  MAX_INVESTMENT_PER_USER: 1000, // Maximum 1000€ par utilisateur
  REQUIRE_2FA_ABOVE: 100, // 2FA obligatoire au-dessus de 100€
  TESTNET_ONLY: true, // TOUJOURS en mode test au début
};

// Plans avec disclaimer
const PLANS = {
  free: {
    priceId: 'free',
    name: 'Gratuit - Mode Démo',
    price: 0,
    features: [
      '1 Bot en mode simulation',
      'Volume max: 100€ (virtuel)',
      'Dashboard basique',
      '⚠️ AUCUN TRADING RÉEL'
    ],
    limits: { maxBots: 1, maxVolume: 100 }
  },
  pro: {
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    name: 'Pro - Trading Simulé',
    price: 49,
    features: [
      '10 Bots',
      'Backtesting historique',
      'Export CSV',
      'Support prioritaire',
      '⚠️ MODE PAPER TRADING UNIQUEMENT'
    ],
    limits: { maxBots: 10, maxVolume: 1000 }
  },
  premium: {
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID!,
    name: 'Premium - Testnet Binance',
    price: 149,
    features: [
      'Bots illimités',
      'API Binance TESTNET',
      'Notifications Telegram',
      '2FA obligatoire',
      '⚠️ LIMITE: 1000€ MAX PAR UTILISATEUR'
    ],
    limits: { maxBots: -1, maxVolume: 1000 }
  }
};

// Logger toutes les transactions
async function logTransaction(userId: string, action: string, details: any) {
  const { error } = await supabase
    .from('transaction_logs')
    .insert({
      user_id: userId,
      action,
      details,
      ip_address: details.ip || 'unknown',
      timestamp: new Date().toISOString()
    });
    
  if (error) console.error('Erreur log transaction:', error);
}

export async function POST(request: Request) {
  try {
    const { planId, userEmail, userId, agreedToRisks } = await request.json();
    
    // VÉRIFICATION 1: Acceptation des risques
    if (!agreedToRisks) {
      return NextResponse.json({ 
        error: 'Vous devez accepter les conditions et risques de trading' 
      }, { status: 400 });
    }
    
    // VÉRIFICATION 2: Plan valide
    if (!PLANS[planId as keyof typeof PLANS]) {
      return NextResponse.json({ error: 'Plan invalide' }, { status: 400 });
    }

    const plan = PLANS[planId as keyof typeof PLANS];
    
    // VÉRIFICATION 3: Limite utilisateur
    const { data: userLimits } = await supabase
      .from('user_limits')
      .select('total_invested')
      .eq('user_id', userId)
      .single();
      
    if (userLimits?.total_invested >= SECURITY_LIMITS.MAX_INVESTMENT_PER_USER) {
      return NextResponse.json({ 
        error: `Limite de sécurité atteinte (max ${SECURITY_LIMITS.MAX_INVESTMENT_PER_USER}€)` 
      }, { status: 400 });
    }

    // Logger la tentative de souscription
    await logTransaction(userId, 'SUBSCRIPTION_ATTEMPT', {
      plan: planId,
      email: userEmail,
      ip: request.headers.get('x-forwarded-for')
    });

    // Créer la session Stripe avec disclaimer
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `CryptoBot Pro - ${plan.name}`,
            description: [
              ...plan.features,
              '',
              '⚠️ AVERTISSEMENT LÉGAL:',
              'Le trading de cryptomonnaies comporte des risques élevés.',
              'Vous pouvez perdre tout votre capital.',
              'Les performances passées ne garantissent pas les résultats futurs.',
              'CryptoBot Pro n\'est PAS un conseil en investissement.'
            ].join('\n'),
          },
          unit_amount: plan.price * 100,
          recurring: {
            interval: 'month',
          },
        },
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?subscription=success&disclaimer=accepted`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing?canceled=true`,
      customer_email: userEmail,
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          max_volume: plan.limits.maxVolume,
          max_bots: plan.limits.maxBots,
          testnet_only: SECURITY_LIMITS.TESTNET_ONLY.toString()
        }
      },
      metadata: {
        planId,
        userId,
        userEmail,
        agreed_to_risks: 'true',
        timestamp: new Date().toISOString()
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Erreur Stripe:', error);
    await logTransaction('unknown', 'SUBSCRIPTION_ERROR', { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}