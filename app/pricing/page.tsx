'use client';

import { loadStripe } from '@stripe/stripe-js';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function Pricing() {
  const [loading, setLoading] = useState('');

  const handleSubscribe = async (plan: string) => {
    setLoading(plan);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      window.location.href = '/signup';
      return;
    }

    const response = await fetch('/api/stripe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, userId: user.id }),
    });

    const { sessionId } = await response.json();
    const stripe = await stripePromise;
    await stripe?.redirectToCheckout({ sessionId });
  };

  const plans = [
    {
      name: 'Gratuit',
      price: 0,
      features: ['1 Bot', '1000€ volume max', 'Dashboard basique'],
      action: null
    },
    {
      name: 'Pro',
      price: 49,
      features: ['10 Bots', 'Backtesting', 'Export CSV', 'Support prioritaire'],
      action: 'pro'
    },
    {
      name: 'Premium',
      price: 149,
      features: ['Bots illimités', 'API Binance', 'Notifications Telegram', 'Support 24/7'],
      action: 'premium'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 py-20">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-white text-center mb-12">
          Choisissez votre plan
        </h1>
        
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div key={plan.name} className="bg-gray-800 rounded-xl p-8 border border-gray-700">
              <h3 className="text-2xl font-bold text-white mb-4">{plan.name}</h3>
              <p className="text-4xl font-bold text-purple-500 mb-6">
                {plan.price}€<span className="text-lg text-gray-400">/mois</span>
              </p>
              
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="text-gray-300 flex items-center">
                    <span className="text-green-500 mr-2">✓</span> {feature}
                  </li>
                ))}
              </ul>
              
              {plan.action ? (
                <button
                  onClick={() => handleSubscribe(plan.action)}
                  disabled={loading === plan.action}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg"
                >
                  {loading === plan.action ? 'Chargement...' : 'S\'abonner'}
                </button>
              ) : (
                <button className="w-full bg-gray-700 text-gray-400 py-3 rounded-lg cursor-not-allowed">
                  Plan actuel
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}