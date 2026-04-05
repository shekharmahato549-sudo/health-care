import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    )

    await supabase.auth.exchangeCodeForSession(code)

    // Get the user and create a user record if it doesn't exist
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', user.id)
        .single()

      if (!existingUser) {
        const [firstName, lastName] = (user.user_metadata?.full_name || 'User Account').split(' ')
        await supabase.from('users').insert({
          auth_id: user.id,
          email: user.email,
          first_name: firstName || 'User',
          last_name: lastName || 'Account',
          role: 'patient',
        })
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL('/dashboard/patient', request.url))
}
