import React, { useState } from 'react'
import { X, Crown, Check, Loader2 } from 'lucide-react'
import stripePromise from '../lib/stripe'
import { supabase } from '../lib/supabase'

export default function SubscriptionModal({ isOpen, onClose, session }) {
  const [loading, setLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('monthly')

  const plans = {
    monthly: {
      name: 'Pro Monthly',
      price: '$9.99',
      priceId: 'price_monthly_test', // Replace with actual Stripe price ID
      interval: 'month'
    },
    yearly: {
      name: 'Pro Yearly',
      price: '$99.99',
      priceId: 'price_yearly_test', // Replace with actual Stripe price ID
      interval: 'year',
      savings: 'Save 17%'
    }
  }

  const handleSubscribe = async () => {
    if (!session?.user) {
      alert('Please sign in to subscribe')
      return
    }

    setLoading(true)
    
    try {
      const stripe = await stripePromise
      
      // Create checkout session via Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId: plans[selectedPlan].priceId,
          userId: session.user.id,
          userEmail: session.user.email
        }
      })

      if (error) throw error

      // Redirect to Stripe Checkout
      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId: data.sessionId
      })

      if (stripeError) throw stripeError

    } catch (error) {
      console.error('Subscription error:', error)
      alert('Failed to start subscription process. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-md w-full p-6 border border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Crown className="w-6 h-6 text-yellow-500" />
            <h2 className="text-2xl font-bold text-white">Upgrade to Pro</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="text-gray-300 text-sm">
            Unlock advanced features for professional presentations:
          </div>
          
          <div className="space-y-2">
            {[
              'Remote presenter/admin sync',
              'Real-time timer control',
              'Custom stage cues & messages',
              'Room PIN protection',
              'Priority support'
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-gray-300">
                <Check className="w-4 h-4 text-green-500" />
                {feature}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {Object.entries(plans).map(([key, plan]) => (
            <div
              key={key}
              className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                selectedPlan === key
                  ? 'border-blue-500 bg-blue-500 bg-opacity-10'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
              onClick={() => setSelectedPlan(key)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-white font-medium">{plan.name}</div>
                  <div className="text-gray-400 text-sm">Billed {plan.interval}ly</div>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold">{plan.price}</div>
                  {plan.savings && (
                    <div className="text-green-400 text-xs">{plan.savings}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Crown className="w-4 h-4" />
              Subscribe to Pro
            </>
          )}
        </button>

        <div className="text-center text-xs text-gray-400 mt-4">
          Secure payment powered by Stripe. Cancel anytime.
        </div>
      </div>
    </div>
  )
}