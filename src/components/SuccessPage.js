import React, { useEffect, useState } from 'react'
import { CheckCircle, Crown, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function SuccessPage({ onContinue }) {
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSubscription()
  }, [])

  const fetchSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('stripe_user_subscriptions')
        .select('*')
        .maybeSingle()

      if (error) {
        console.error('Error fetching subscription:', error)
      } else {
        setSubscription(data)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-xl p-8 border border-gray-700 text-center">
        <div className="mb-6">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-2">Payment Successful!</h2>
          <p className="text-gray-300">
            Thank you for subscribing to SyncCue Pro. Your account has been upgraded.
          </p>
        </div>

        {loading ? (
          <div className="text-gray-400 mb-6">Loading subscription details...</div>
        ) : subscription ? (
          <div className="bg-gray-700 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              <span className="text-white font-medium">Pro Subscription Active</span>
            </div>
            <div className="text-sm text-gray-300">
              Status: <span className="capitalize text-green-400">{subscription.subscription_status}</span>
            </div>
            {subscription.current_period_end && (
              <div className="text-sm text-gray-300">
                Next billing: {new Date(subscription.current_period_end * 1000).toLocaleDateString()}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-700 rounded-lg p-4 mb-6">
            <div className="text-yellow-400 text-sm">
              Subscription details are being processed. This may take a few moments.
            </div>
          </div>
        )}

        <div className="space-y-3 mb-6 text-left">
          <h3 className="text-white font-medium text-center mb-3">You now have access to:</h3>
          {[
            'Remote presenter/admin sync',
            'Real-time timer control',
            'Custom stage cues & messages',
            'Room PIN protection',
            'Priority support'
          ].map((feature, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-gray-300">
              <CheckCircle className="w-4 h-4 text-green-500" />
              {feature}
            </div>
          ))}
        </div>

        <button
          onClick={onContinue}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          Continue to App
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}