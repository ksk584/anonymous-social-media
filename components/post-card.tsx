"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { CommentSection } from "./comment-section"
import { formatDate } from "@/lib/utils/format"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"

interface Post {
  id: string
  content: string
  image_url: string | null
  user_id: string
  created_at: string
  profiles: { username: string }
}

interface PostCardProps {
  post: Post
  onRefresh: () => void
}

export function PostCard({ post, onRefresh }: PostCardProps) {
  const [showComments, setShowComments] = useState(false)
  const [showReportMenu, setShowReportMenu] = useState(false)
  const [hasReported, setHasReported] = useState(false)
  const { user } = useAuth()
  const supabase = createClient()

  const handleReport = async (reason: string) => {
    try {
      const { error } = await supabase.from("reports").insert({
        post_id: post.id,
        reason: reason,
      })

      if (error) throw error
      setHasReported(true)
      setShowReportMenu(false)
      setTimeout(() => setShowReportMenu(false), 1500)
    } catch (error) {
      console.error("Error reporting post:", error)
    }
  }

  const isOwnPost = user?.id === post.user_id

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return

    try {
      const { error } = await supabase.from("posts").delete().eq("id", post.id)

      if (error) throw error
      onRefresh()
    } catch (error) {
      console.error("Error deleting post:", error)
    }
  }

  const reportReasons = ["Spam", "Offensive", "Misinformation", "Inappropriate", "Other"]

  return (
    <Card className="bg-card border border-border/50 shadow-sm hover:shadow-md hover:border-border/80 transition-all duration-200">
      <CardHeader className="pb-4 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="font-semibold text-card-foreground text-sm">{post.profiles.username}</p>
            <p className="text-xs text-muted-foreground mt-1">{formatDate(post.created_at)}</p>
          </div>
          <div className="flex items-center gap-2">
            {isOwnPost && (
              <button
                onClick={handleDelete}
                className="text-muted-foreground hover:text-destructive text-lg transition-colors"
                title="Delete post"
              >
                🗑️
              </button>
            )}
            <div className="relative">
              <button
                onClick={() => setShowReportMenu(!showReportMenu)}
                className="text-muted-foreground hover:text-primary text-lg transition-colors"
                title="Report post"
              >
                ⚠️
              </button>
              {showReportMenu && !hasReported && (
                <div className="absolute right-0 top-6 bg-card border border-border rounded-lg shadow-lg z-10 min-w-40">
                  <div className="p-2 space-y-1">
                    {reportReasons.map((reason) => (
                      <button
                        key={reason}
                        onClick={() => handleReport(reason)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-primary/10 text-card-foreground rounded transition-colors"
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {hasReported && (
                <span className="text-xs text-muted-foreground absolute top-6 right-0 whitespace-nowrap">
                  Reported ✓
                </span>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-3">
        <p className="text-card-foreground text-sm leading-relaxed whitespace-pre-wrap break-words">{post.content}</p>

        {post.image_url && (
          <div className="rounded-lg overflow-hidden bg-muted border border-border/30">
            <img
              src={post.image_url || "/placeholder.svg"}
              alt="Post image"
              className="w-full h-auto max-h-96 object-cover hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = "none"
              }}
            />
          </div>
        )}

        <button
          onClick={() => setShowComments(!showComments)}
          className="text-sm text-primary hover:text-primary/80 font-medium transition-colors duration-200 flex items-center gap-1"
        >
          <span>{showComments ? "✕" : "💬"}</span>
          {showComments ? "Hide comments" : "View comments"}
        </button>

        {showComments && (
          <div className="pt-2 animate-in fade-in duration-200">
            <CommentSection postId={post.id} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
