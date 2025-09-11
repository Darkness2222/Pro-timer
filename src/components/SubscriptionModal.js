import React, { useState } from 'react'
import { X, Crown, Check, Loader2 } from 'lucide-react'
import { products } from '../stripe-config.js'
import { supabase } from '../lib/supabase'

export default function SubscriptionModal({ isOpen, onClose, session }) {
  const [loading, setLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(products[1]?.priceId || '')

  const planOptions = products.map(product => ({
    ...product,
    displayPrice: product.name === 'Yearly' ? 'C$99.00' : 'C$9.99',
    interval: product.name === 'Yearly' ? 'year' : 'month',
    savings: product.name === 'Yearly' ? 'Save 17%' : null
  }))

  const handleSubscribe = async () => {
    if (!session?.user) {
      console.error('No user session found')
      return
    }

    setLoading(true)
    
    try {
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: {
          price_id: selectedPlan,
          mode: 'subscription',
          success_url: `${window.location.origin}/app?success=true`,
          cancel_url: `${window.location.origin}/app?canceled=true`
        }
      })

      if (error) throw error

      if (data?.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL received')
      }

    } catch (error) {
      console.error('Subscription error:', error)
      // You could add a toast notification here instead of alert
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
          {planOptions.map((plan) => (
            <div
              key={plan.priceId}
              className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                selectedPlan === plan.priceId
                  ? 'border-blue-500 bg-blue-500 bg-opacity-10'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
              onClick={() => setSelectedPlan(plan.priceId)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-white font-medium">{plan.name}</div>
                  <div className="text-gray-400 text-sm">{plan.description}</div>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold">{plan.displayPrice}</div>
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