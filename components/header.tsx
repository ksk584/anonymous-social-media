"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import Link from "next/link"

export function Header() {
  const { user, userProfile, logout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push("/auth/login")
  }

  return (
    <header className="bg-accent/10 border-b border-accent/20 sticky top-0 z-50">
      <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-accent">
          Social Feed
        </Link>

        <div className="flex items-center gap-4">
          {user && userProfile && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-foreground">{userProfile.username}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-accent hover:bg-accent/90 text-background rounded-lg font-medium transition"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
