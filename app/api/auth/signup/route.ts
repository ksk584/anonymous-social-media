import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // Handle cookie setting errors silently
        }
      },
    },
  })

  try {
    const { email, password, username } = await req.json()

    if (!email || !password || !username) {
      return NextResponse.json({ error: "Email, password, and username are required" }, { status: 400 })
    }
const { data, error: signupError } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: { username }
  }
})

// Now 'signupError' exists, so your error box will work!
if (signupError) {
  // handle error
}

    if (!data.user) {
      throw new Error("No user created")
    }


    return NextResponse.json({ message: "Signup successful" }, { status: 200 })
  } catch (error: any) {
    console.error("[v0] Signup error:", error.message)
    return NextResponse.json({ error: error.message || "Failed to sign up" }, { status: 500 })
  }
}
