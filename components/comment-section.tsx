"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils/format"

interface Comment {
  id: string
  content: string
  user_id: string
  created_at: string
  profiles: { username: string }
}

interface CommentSectionProps {
  postId: string
}

export function CommentSection({ postId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const { user } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    fetchComments()
    const subscription = supabase
      .channel(`comments:${postId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comments", filter: `post_id=eq.${postId}` },
        (payload) => {
          setComments((prev) => [...prev, payload.new as Comment])
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [postId])

  const fetchComments = async () => {
    setLoading(true)
    try {
      const { data, error: fetchError } = await supabase
        .from("comments")
        .select("*, profiles(username)")
        .eq("post_id", postId)
        .order("created_at", { ascending: true })

      if (fetchError) throw fetchError
      setComments(data || [])
    } catch (error) {
      console.error("Error fetching comments:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!commentText.trim()) {
      setError("Please write a comment")
      return
    }

    if (!user) {
      setError("You must be logged in to comment")
      return
    }

    setSubmitting(true)

    try {
      const { data, error: insertError } = await supabase
        .from("comments")
        .insert({
          post_id: postId,
          content: commentText.trim(),
          user_id: user.id,
        })
        .select("*, profiles(username)")
        .single()

      if (insertError) throw insertError

      setComments([...comments, data])
      setCommentText("")
    } catch (error) {
      console.error("Error adding comment:", error)
      setError("Failed to add comment")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string, commentUserId: string) => {
    if (user?.id !== commentUserId) return

    try {
      const { error } = await supabase.from("comments").delete().eq("id", commentId)

      if (error) throw error
      setComments(comments.filter((c) => c.id !== commentId))
    } catch (error) {
      console.error("Error deleting comment:", error)
    }
  }

  return (
    <div className="border-t border-border/30 pt-4 space-y-4">
      <form onSubmit={handleAddComment} className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Reply to this post..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            maxLength={200}
          />
          <Button type="submit" disabled={submitting} size="sm" className="whitespace-nowrap">
            {submitting ? "..." : "Reply"}
          </Button>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </form>

      <div className="space-y-3">
        {loading ? (
          <p className="text-xs text-muted-foreground">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-xs text-muted-foreground">No comments yet. Be the first!</p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-muted/40 border border-border/20 rounded-lg p-3 space-y-1 hover:bg-muted/60 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">{comment.profiles.username}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</p>
                  {user?.id === comment.user_id && (
                    <button
                      onClick={() => handleDeleteComment(comment.id, comment.user_id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive text-xs transition-all"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-foreground/80">{comment.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
