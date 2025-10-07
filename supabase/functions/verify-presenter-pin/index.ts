import { createClient } from 'npm:@supabase/supabase-js@2.56.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
}

interface VerifyPinRequest {
  presenterId: string
  pin: string
  eventId?: string
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { presenterId, pin, eventId }: VerifyPinRequest = await req.json()

    if (!presenterId || !pin) {
      return new Response(
        JSON.stringify({ error: 'Presenter ID and PIN are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const { data: presenter, error: fetchError } = await supabase
      .from('organization_presenters')
      .select('*')
      .eq('id', presenterId)
      .maybeSingle()

    if (fetchError || !presenter) {
      return new Response(
        JSON.stringify({ error: 'Presenter not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (presenter.pin_locked_until && new Date(presenter.pin_locked_until) > new Date()) {
      const lockTimeRemaining = Math.ceil(
        (new Date(presenter.pin_locked_until).getTime() - Date.now()) / 1000 / 60
      )
      
      await supabase.from('presenter_pin_audit_logs').insert({
        organization_id: presenter.organization_id,
        presenter_id: presenterId,
        event_id: eventId || null,
        action: 'failed',
        success: false,
        device_info: req.headers.get('user-agent') || null,
        details: { reason: 'account_locked', lock_time_remaining: lockTimeRemaining },
      })

      return new Response(
        JSON.stringify({
          error: 'Account temporarily locked due to too many failed attempts',
          locked: true,
          lockTimeRemaining,
        }),
        {
          status: 423,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (!presenter.access_pin) {
      return new Response(
        JSON.stringify({ error: 'No PIN configured for this presenter' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (presenter.pin_expires_at && new Date(presenter.pin_expires_at) < new Date()) {
      await supabase.from('presenter_pin_audit_logs').insert({
        organization_id: presenter.organization_id,
        presenter_id: presenterId,
        event_id: eventId || null,
        action: 'failed',
        success: false,
        device_info: req.headers.get('user-agent') || null,
        details: { reason: 'pin_expired' },
      })

      return new Response(
        JSON.stringify({ error: 'PIN has expired', expired: true }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const pinMatch = presenter.access_pin === pin

    if (!pinMatch) {
      const newFailedAttempts = (presenter.pin_failed_attempts || 0) + 1
      const shouldLock = newFailedAttempts >= 5
      const lockUntil = shouldLock
        ? new Date(Date.now() + 15 * 60 * 1000).toISOString()
        : null

      await supabase
        .from('organization_presenters')
        .update({
          pin_failed_attempts: newFailedAttempts,
          pin_locked_until: lockUntil,
        })
        .eq('id', presenterId)

      await supabase.from('presenter_pin_audit_logs').insert({
        organization_id: presenter.organization_id,
        presenter_id: presenterId,
        event_id: eventId || null,
        action: shouldLock ? 'locked' : 'failed',
        success: false,
        device_info: req.headers.get('user-agent') || null,
        details: {
          reason: 'invalid_pin',
          failed_attempts: newFailedAttempts,
          locked: shouldLock,
        },
      })

      return new Response(
        JSON.stringify({
          error: 'Invalid PIN',
          remainingAttempts: Math.max(0, 5 - newFailedAttempts),
          locked: shouldLock,
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    await supabase
      .from('organization_presenters')
      .update({
        pin_failed_attempts: 0,
        pin_locked_until: null,
        pin_last_used_at: new Date().toISOString(),
      })
      .eq('id', presenterId)

    await supabase.from('presenter_pin_audit_logs').insert({
      organization_id: presenter.organization_id,
      presenter_id: presenterId,
      event_id: eventId || null,
      action: 'verified',
      success: true,
      device_info: req.headers.get('user-agent') || null,
    })

    return new Response(
      JSON.stringify({
        success: true,
        verified: true,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error verifying PIN:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})