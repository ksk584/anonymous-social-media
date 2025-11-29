"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface CreatePostFormProps {
  onPostCreated: (post: any) => void
}

export function CreatePostForm({ onPostCreated }: CreatePostFormProps) {
  const [content, setContent] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { user } = useAuth()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!content.trim()) {
      setError("Please write something to post")
      return
    }

    if (!user) {
      setError("You must be logged in to post")
      return
    }

    setLoading(true)

    try {
      const { data, error: insertError } = await supabase
        .from("posts")
        .insert({
          content: content.trim(),
          image_url: imageUrl.trim() || null,
          user_id: user.id,
        })
        .select()
        .single()

      if (insertError) throw insertError

      const { data: profile } = await supabase.from("profiles").select("username").eq("id", user.id).single()

      const enrichedPost = {
        ...data,
        profiles: profile,
      }

      onPostCreated(enrichedPost)
      setContent("")
      setImageUrl("")
    } catch (error) {
      console.error("Error creating post:", error)
      setError("Failed to create post")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-card border-2 border-border/50 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">What's on your mind?</label>
            <textarea
              placeholder="Share your thoughts, ideas, or questions..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              rows={4}
              maxLength={500}
            />
            <div className="flex justify-end mt-1">
              <span className="text-xs text-muted-foreground">{content.length}/500</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Image URL (optional)</label>
            <input
              type="url"
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full font-semibold">
            {loading ? "Posting..." : "Post"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
