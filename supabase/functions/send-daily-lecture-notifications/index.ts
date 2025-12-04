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

    // Use IST timezone (UTC+5:30) for India
    const now = new Date()
    const istOffset = 5.5 * 60 * 60 * 1000 // IST is UTC+5:30
    const istNow = new Date(now.getTime() + istOffset)
    
    const dayOfWeek = istNow.getUTCDay()
    const currentHour = istNow.getUTCHours()
    const currentMinute = istNow.getUTCMinutes()
    const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}:00`
    
    // Get today's date in IST for deduplication
    const todayIST = istNow.toISOString().split('T')[0]

    console.log(`IST Time: ${istNow.toISOString()}, Day: ${dayOfWeek}, Time: ${currentTime}`)

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

    let createdNotificationsCount = 0
    let externalMessageCount = 0

    for (const lecture of lectures) {
      try {
        // Get user profile for phone number, preferences, and notification time
        const { data: profile } = await supabase
          .from('profiles')
          .select('phone_number, enable_whatsapp, enable_sms, notification_time')
          .eq('id', lecture.user_id)
          .single()

        // Check if it's the right time to notify this user
        let shouldNotify = true
        if (profile?.notification_time) {
          const userNotificationTime = profile.notification_time.substring(0, 5) // HH:MM
          const currentTimeShort = currentTime.substring(0, 5) // HH:MM
          
          const userMinutes = parseInt(userNotificationTime.split(':')[0]) * 60 + parseInt(userNotificationTime.split(':')[1])
          const currentMinutes = parseInt(currentTimeShort.split(':')[0]) * 60 + parseInt(currentTimeShort.split(':')[1])
          
          // Only notify within 30-minute window of user's preferred time
          if (Math.abs(currentMinutes - userMinutes) > 30) {
            console.log(`Skipping user ${lecture.user_id} - not their notification time (preferred: ${userNotificationTime}, current: ${currentTimeShort})`)
            shouldNotify = false
          }
        }

        if (!shouldNotify) continue

        // Check if notification already exists for this lecture today
        const startOfDayIST = `${todayIST}T00:00:00+05:30`
        const endOfDayIST = `${todayIST}T23:59:59+05:30`
        
        const { data: existingNotification } = await supabase
          .from('notifications')
          .select('id')
          .eq('lecture_id', lecture.id)
          .eq('user_id', lecture.user_id)
          .gte('created_at', startOfDayIST)
          .lte('created_at', endOfDayIST)
          .single()

        if (existingNotification) {
          console.log(`Notification already exists for lecture ${lecture.id} today, skipping in-app notification`)
        } else {
          // Create in-app notification
          const { error: notificationError } = await supabase
            .from('notifications')
            .insert({
              user_id: lecture.user_id,
              lecture_id: lecture.id,
              title: `Today's Lecture: ${lecture.subject}`,
              message: `${lecture.title}\n📍 Location: ${lecture.location}\n⏰ Time: ${lecture.lecture_time}\n👨‍🏫 Professor: ${lecture.professor_name}${lecture.additional_notes ? '\n📝 Note: ' + lecture.additional_notes : ''}`,
              type: 'lecture',
              is_read: false,
            })

          if (notificationError) {
            console.error('Error creating notification:', notificationError)
          } else {
            createdNotificationsCount++
            console.log(`Created in-app notification for lecture: ${lecture.subject}`)
          }
        }

        // Send external messages (WhatsApp/SMS) - also check for duplicates
        if (profile?.phone_number && !existingNotification) {
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
        console.error('Error processing lecture:', lecture.id, error)
      }
    }

    console.log(`Created ${createdNotificationsCount} in-app notifications, sent ${externalMessageCount} external messages`)

    return new Response(
      JSON.stringify({
        message: 'Daily lecture notifications processed',
        inAppCount: createdNotificationsCount,
        externalCount: externalMessageCount,
        day: dayOfWeek,
        timeIST: currentTime,
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
