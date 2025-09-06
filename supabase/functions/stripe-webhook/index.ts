import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

const cryptoProvider = Stripe.createSubtleCryptoProvider()

serve(async (request) => {
  const signature = request.headers.get('Stripe-Signature')
  const body = await request.text()
  
  let receivedEvent
  try {
    receivedEvent = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!,
      undefined,
      cryptoProvider
    )
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message)
    return new Response(err.message, { status: 400 })
  }

  console.log(`🔔 Event received: ${receivedEvent.type}`)

  try {
    switch (receivedEvent.type) {
      case 'checkout.session.completed':
        const session = receivedEvent.data.object
        const userId = session.metadata?.userId
        
        if (userId) {
          // Update user's pro status
          const { error } = await supabase
            .from('profiles')
            .upsert({
              id: userId,
              email: session.customer_email,
              is_pro: true,
            })
          
          if (error) {
            console.error('Error updating user profile:', error)
          } else {
            console.log(`✅ User ${userId} upgraded to Pro`)
          }
        }
        break

      case 'customer.subscription.deleted':
        const subscription = receivedEvent.data.object
        // Handle subscription cancellation
        console.log('Subscription canceled:', subscription.id)
        break

      default:
        console.log(`Unhandled event type: ${receivedEvent.type}`)
    }
  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response('Webhook processing failed', { status: 500 })
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  })
})