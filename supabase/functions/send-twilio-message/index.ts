import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TwilioMessageRequest {
  to: string
  message: string
  type: 'sms' | 'whatsapp'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER')
    const twilioWhatsAppNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER')

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber || !twilioWhatsAppNumber) {
      throw new Error('Twilio credentials not configured')
    }

    const { to, message, type }: TwilioMessageRequest = await req.json()

    console.log(`Sending ${type} message to ${to}`)

    // Validate phone number format
    if (!to || to.trim() === '') {
      throw new Error('Invalid phone number')
    }

    // Validate message content
    if (!message || message.trim() === '') {
      throw new Error('Message cannot be empty')
    }

    // Determine the 'from' number based on message type
    const fromNumber = type === 'whatsapp' 
      ? `whatsapp:${twilioWhatsAppNumber}` 
      : twilioPhoneNumber

    const toNumber = type === 'whatsapp' 
      ? `whatsapp:${to}` 
      : to

    // Send message via Twilio API
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`
    
    const formData = new URLSearchParams()
    formData.append('To', toNumber)
    formData.append('From', fromNumber)
    formData.append('Body', message)

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Twilio API error:', data)
      throw new Error(data.message || 'Failed to send message')
    }

    console.log('Message sent successfully:', data.sid)

    return new Response(
      JSON.stringify({ success: true, messageSid: data.sid }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    console.error('Error in send-twilio-message:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
