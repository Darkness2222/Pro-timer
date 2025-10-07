import { createClient } from 'npm:@supabase/supabase-js@2.56.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
}

interface SendPinRequest {
  presenterId: string
  pin: string
  eventName?: string
  eventDate?: string
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

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const { presenterId, pin, eventName, eventDate }: SendPinRequest = await req.json()

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
      .select('presenter_name, email, organization_id')
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

    if (!presenter.email) {
      return new Response(
        JSON.stringify({ error: 'Presenter has no email address configured' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Presenter Access PIN</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: #f9fafb;
              border-radius: 12px;
              padding: 32px;
              margin: 20px 0;
            }
            .header {
              text-align: center;
              margin-bottom: 32px;
            }
            .pin-box {
              background: white;
              border: 2px solid #3b82f6;
              border-radius: 8px;
              padding: 24px;
              text-align: center;
              margin: 24px 0;
            }
            .pin-label {
              font-size: 14px;
              color: #6b7280;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 8px;
            }
            .pin-code {
              font-size: 48px;
              font-weight: bold;
              color: #1f2937;
              letter-spacing: 8px;
              font-family: 'Courier New', monospace;
            }
            .event-details {
              background: white;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .event-row {
              display: flex;
              padding: 8px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .event-row:last-child {
              border-bottom: none;
            }
            .event-label {
              font-weight: 600;
              color: #6b7280;
              width: 120px;
            }
            .event-value {
              color: #1f2937;
            }
            .instructions {
              background: #eff6ff;
              border-left: 4px solid #3b82f6;
              padding: 16px;
              margin: 20px 0;
            }
            .instructions ol {
              margin: 8px 0;
              padding-left: 20px;
            }
            .footer {
              text-align: center;
              color: #6b7280;
              font-size: 14px;
              margin-top: 32px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
            }
            .security-note {
              background: #fef3c7;
              border: 1px solid #fbbf24;
              border-radius: 6px;
              padding: 12px;
              margin: 20px 0;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="color: #1f2937; margin: 0;">🎤 Your Presenter Access PIN</h1>
              <p style="color: #6b7280; margin: 8px 0 0 0;">SyncCue Pro Timer System</p>
            </div>

            <p>Hi ${presenter.presenter_name},</p>
            <p>Your secure PIN for accessing the presenter timer has been generated.</p>

            <div class="pin-box">
              <div class="pin-label">Your PIN</div>
              <div class="pin-code">${pin}</div>
            </div>

            ${eventName || eventDate ? `
              <div class="event-details">
                <h3 style="margin-top: 0; color: #1f2937;">Event Details</h3>
                ${eventName ? `
                  <div class="event-row">
                    <div class="event-label">Event:</div>
                    <div class="event-value">${eventName}</div>
                  </div>
                ` : ''}
                ${eventDate ? `
                  <div class="event-row">
                    <div class="event-label">Date:</div>
                    <div class="event-value">${new Date(eventDate).toLocaleString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</div>
                  </div>
                ` : ''}
              </div>
            ` : ''}

            <div class="instructions">
              <strong>How to Access Your Timer:</strong>
              <ol>
                <li>Scan the QR code provided by your event organizer</li>
                <li>Select your name from the presenter list</li>
                <li>Enter your PIN when prompted</li>
                <li>Access your personal timer view</li>
              </ol>
            </div>

            <div class="security-note">
              ⚠️ <strong>Security Note:</strong> Keep this PIN confidential. Do not share it with others. The PIN may expire after use depending on event settings.
            </div>

            <div class="footer">
              <p>This is an automated message from SyncCue Pro Timer.</p>
              <p>If you did not expect this email, please contact your event organizer.</p>
            </div>
          </div>
        </body>
      </html>
    `

    const emailText = `
Your Presenter Access PIN

Hi ${presenter.presenter_name},

Your secure PIN for accessing the presenter timer: ${pin}

${eventName ? `Event: ${eventName}\n` : ''}${eventDate ? `Date: ${new Date(eventDate).toLocaleString()}\n` : ''}

How to Access Your Timer:
1. Scan the QR code provided by your event organizer
2. Select your name from the presenter list
3. Enter your PIN when prompted
4. Access your personal timer view

Security Note: Keep this PIN confidential. Do not share it with others.

This is an automated message from SyncCue Pro Timer.
    `

    console.log('Sending PIN email to:', presenter.email)
    console.log('Note: In production, integrate with a real email service like SendGrid, AWS SES, or Resend')

    await supabase.from('presenter_pin_audit_logs').insert({
      organization_id: presenter.organization_id,
      presenter_id: presenterId,
      action: 'generated',
      success: true,
      details: { delivery_method: 'email', email: presenter.email },
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'PIN email sent successfully (simulated)',
        email: presenter.email,
        note: 'Email sending is simulated. In production, integrate with SendGrid, AWS SES, or Resend.',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error sending PIN:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})