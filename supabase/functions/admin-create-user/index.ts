import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('🚀 Admin Create User Function Called - Method:', req.method)
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling CORS preflight request')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('📝 Starting user creation process...')
    
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    
    console.log('🔐 Environment check:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!serviceRoleKey,
      hasAnonKey: !!anonKey
    })

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      console.error('❌ Missing environment variables')
      return new Response(
        JSON.stringify({ error: 'Missing environment configuration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create clients
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
    const supabaseClient = createClient(supabaseUrl, anonKey)

    // Check authorization
    const authHeader = req.headers.get('Authorization')
    console.log('🔑 Auth header present:', !!authHeader)
    
    if (!authHeader) {
      console.error('❌ No authorization header')
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    console.log('🎫 Token extracted, length:', token.length)

    // Verify user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    console.log('👤 User verification:', { hasUser: !!user, error: userError?.message })
    
    if (userError || !user) {
      console.error('❌ User verification failed:', userError)
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check user role
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    console.log('👨‍💼 Profile check:', { role: profile?.role, error: profileError?.message })

    if (profileError || !profile || !['admin', 'super_admin'].includes(profile.role)) {
      console.error('❌ Insufficient permissions:', { role: profile?.role })
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    let requestBody
    try {
      requestBody = await req.json()
      console.log('📋 Request body parsed:', Object.keys(requestBody))
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError)
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { email, password, fullName, phone, role = 'driver' } = requestBody

    console.log('🎯 Creating user with:', { email, hasPassword: !!password, fullName, hasPhone: !!phone, role })

    if (!email || !password || !fullName) {
      console.error('❌ Missing required fields:', { email: !!email, password: !!password, fullName: !!fullName })
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, password, and fullName are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create user
    console.log('👤 Creating auth user...')
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    })

    if (createError) {
      console.error('❌ User creation failed:', createError)
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ User created successfully:', newUser.user.id)

    // Create profile
    console.log('👤 Creating profile...')
    const { error: profileInsertError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: newUser.user.id,
        email: email,
        full_name: fullName,
        phone: phone || null,
        role: role
      })

    if (profileInsertError) {
      console.error('❌ Profile creation failed:', profileInsertError)
      return new Response(
        JSON.stringify({ error: `Failed to create profile: ${profileInsertError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Profile created successfully')
    console.log('🎉 User creation process completed successfully')

    return new Response(
      JSON.stringify({ user: newUser.user }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('💥 Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: `Internal server error: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})