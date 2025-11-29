"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { PostCard } from "./post-card"
import { CreatePostForm } from "./create-post-form"

interface Post {
  id: string
  content: string
  image_url: string | null
  user_id: string
  created_at: string
  profiles: { username: string }
}

export function Feed() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    fetchPosts()
    const subscription = supabase
      .channel("posts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, (payload) => {
        setPosts([payload.new as Post, ...posts])
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const { data: posts, error: postsError } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })

      if (postsError) throw postsError

      if (posts && posts.length > 0) {
        const userIds = [...new Set(posts.map((p) => p.user_id))]
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, username")
          .in("id", userIds)

        if (!profilesError && profiles) {
          const profileMap = Object.fromEntries(profiles.map((p) => [p.id, p]))
          const enrichedPosts = posts.map((post) => ({
            ...post,
            profiles: profileMap[post.user_id],
          }))
          setPosts(enrichedPosts)
        }
      } else {
        setPosts([])
      }
    } catch (error) {
      console.error("Error fetching posts:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePostCreated = (newPost: Post) => {
    setPosts([newPost, ...posts])
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-2">
            Social Feed
          </h1>
          <p className="text-muted-foreground">Share your thoughts with the community</p>
        </div>

        <CreatePostForm onPostCreated={handlePostCreated} />

        <div className="mt-8 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-pulse space-y-4 w-full">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-card rounded-lg" />
                ))}
              </div>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">📝</div>
              <p className="text-muted-foreground text-lg">No posts yet. Be the first to share!</p>
            </div>
          ) : (
            posts.map((post) => <PostCard key={post.id} post={post} onRefresh={fetchPosts} />)
          )}
        </div>
      </div>
    </div>
  )
}
