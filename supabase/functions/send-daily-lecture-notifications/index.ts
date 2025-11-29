import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('Starting daily lecture notification job...')

    // Get current day of week (0 = Sunday, 6 = Saturday)
    const now = new Date()
    const dayOfWeek = now.getDay()

    console.log(`Today is day ${dayOfWeek}`)

    // Get all active lectures for today
    const { data: lectures, error: lecturesError } = await supabase
      .from('lectures')
      .select('*')
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)

    if (lecturesError) {
      console.error('Error fetching lectures:', lecturesError)
      throw lecturesError
    }

    console.log(`Found ${lectures?.length || 0} lectures for today`)

    if (!lectures || lectures.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No lectures scheduled for today', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create notifications for each lecture
    const notifications = lectures.map(lecture => ({
      user_id: lecture.user_id,
      lecture_id: lecture.id,
      title: `Today's Lecture: ${lecture.subject}`,
      message: `${lecture.title}\n📍 Location: ${lecture.location}\n⏰ Time: ${lecture.lecture_time}\n👨‍🏫 Professor: ${lecture.professor_name}${lecture.additional_notes ? '\n📝 Note: ' + lecture.additional_notes : ''}`,
      type: 'lecture',
      is_read: false,
    }))

    const { data: createdNotifications, error: notificationsError } = await supabase
      .from('notifications')
      .insert(notifications)
      .select()

    if (notificationsError) {
      console.error('Error creating notifications:', notificationsError)
      throw notificationsError
    }

    console.log(`Successfully created ${createdNotifications?.length || 0} notifications`)

    // Send WhatsApp and SMS notifications
    let externalMessageCount = 0
    for (const lecture of lectures) {
      try {
        // Get user profile for phone number and preferences
        const { data: profile } = await supabase
          .from('profiles')
          .select('phone_number, enable_whatsapp, enable_sms')
          .eq('id', lecture.user_id)
          .single()

        if (profile?.phone_number) {
          const message = `🎓 Today's Lecture: ${lecture.subject}\n\n${lecture.title}\n📍 ${lecture.location}\n⏰ ${lecture.lecture_time}\n👨‍🏫 ${lecture.professor_name}${lecture.additional_notes ? '\n📝 ' + lecture.additional_notes : ''}`

          // Send WhatsApp if enabled
          if (profile.enable_whatsapp) {
            try {
              const whatsappResponse = await supabase.functions.invoke('send-twilio-message', {
                body: {
                  to: profile.phone_number,
                  message,
                  type: 'whatsapp'
                }
              })
              if (whatsappResponse.error) {
                console.error('WhatsApp error:', whatsappResponse.error)
              } else {
                externalMessageCount++
                console.log('WhatsApp sent to:', profile.phone_number)
              }
            } catch (error) {
              console.error('WhatsApp send failed:', error)
            }
          }

          // Send SMS if enabled
          if (profile.enable_sms) {
            try {
              const smsResponse = await supabase.functions.invoke('send-twilio-message', {
                body: {
                  to: profile.phone_number,
                  message,
                  type: 'sms'
                }
              })
              if (smsResponse.error) {
                console.error('SMS error:', smsResponse.error)
              } else {
                externalMessageCount++
                console.log('SMS sent to:', profile.phone_number)
              }
            } catch (error) {
              console.error('SMS send failed:', error)
            }
          }
        }
      } catch (error) {
        console.error('Error sending external notification:', error)
      }
    }

    console.log(`Sent ${externalMessageCount} external messages (WhatsApp/SMS)`)

    return new Response(
      JSON.stringify({
        message: 'Daily lecture notifications sent successfully',
        inAppCount: createdNotifications?.length || 0,
        externalCount: externalMessageCount,
        day: dayOfWeek,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    console.error('Error in send-daily-lecture-notifications:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
