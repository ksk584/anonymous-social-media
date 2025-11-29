"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils/format"

interface Report {
  id: string
  post_id: string
  reason: string
  created_at: string
}

interface Post {
  id: string
  content: string
  image_url: string | null
  author_name: string
  created_at: string
}

interface ReportedPost {
  report: Report
  post: Post
  reportCount: number
}

export default function ModeratorPage() {
  const [reportedPosts, setReportedPosts] = useState<ReportedPost[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchReportedPosts()
  }, [])

  const fetchReportedPosts = async () => {
    setLoading(true)
    try {
      // Get all reports grouped by post
      const { data: reports, error: reportsError } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false })

      if (reportsError) throw reportsError

      // Get unique post IDs
      const postIds = [...new Set((reports || []).map((r) => r.post_id))]

      // Fetch all posts
      const { data: posts, error: postsError } = await supabase.from("posts").select("*").in("id", postIds)

      if (postsError) throw postsError

      // Combine reports with posts and count reports per post
      const postMap = new Map(posts?.map((p) => [p.id, p]) || [])
      const reportsByPost = new Map<string, Report[]>()
      ;(reports || []).forEach((report) => {
        if (!reportsByPost.has(report.post_id)) {
          reportsByPost.set(report.post_id, [])
        }
        reportsByPost.get(report.post_id)?.push(report)
      })

      const combined = Array.from(reportsByPost.entries())
        .map(([postId, postReports]) => ({
          report: postReports[0],
          post: postMap.get(postId)!,
          reportCount: postReports.length,
        }))
        .filter((item) => item.post)

      setReportedPosts(combined)
    } catch (error) {
      console.error("Error fetching reported posts:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePost = async (postId: string) => {
    try {
      const { error } = await supabase.from("posts").delete().eq("id", postId)

      if (error) throw error
      setReportedPosts(reportedPosts.filter((item) => item.post.id !== postId))
    } catch (error) {
      console.error("Error deleting post:", error)
    }
  }

  const handleDismissReports = async (postId: string) => {
    try {
      const { error } = await supabase.from("reports").delete().eq("post_id", postId)

      if (error) throw error
      setReportedPosts(reportedPosts.filter((item) => item.post.id !== postId))
    } catch (error) {
      console.error("Error dismissing reports:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Moderator Dashboard</h1>
            <p className="text-muted-foreground">Manage reported posts and maintain community standards</p>
          </div>
          <Link href="/">
            <Button variant="outline">Back to Feed</Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading reported posts...</div>
          </div>
        ) : reportedPosts.length === 0 ? (
          <Card className="bg-card border border-border/50">
            <CardContent className="py-12 text-center">
              <div className="text-4xl mb-3">✨</div>
              <p className="text-muted-foreground text-lg">No reported posts. Community is healthy!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Total reported posts: <span className="font-bold text-foreground">{reportedPosts.length}</span>
            </div>
            {reportedPosts.map((item) => (
              <Card
                key={item.post.id}
                className="bg-card border border-red-500/30 hover:border-red-500/50 transition-colors"
              >
                <CardHeader className="pb-4 border-b border-border/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg text-card-foreground">{item.post.author_name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">{formatDate(item.post.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-red-500">{item.reportCount} reports</div>
                      <p className="text-xs text-muted-foreground">Primary: {item.report.reason}</p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-4 space-y-4">
                  <div className="bg-muted/50 p-4 rounded-lg border border-border/30">
                    <p className="text-card-foreground text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {item.post.content}
                    </p>
                  </div>

                  {item.post.image_url && (
                    <div className="rounded-lg overflow-hidden bg-muted border border-border/30">
                      <img
                        src={item.post.image_url || "/placeholder.svg"}
                        alt="Post image"
                        className="w-full h-auto max-h-64 object-cover"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).style.display = "none"
                        }}
                      />
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button onClick={() => handleDeletePost(item.post.id)} variant="destructive" className="flex-1">
                      Delete Post
                    </Button>
                    <Button onClick={() => handleDismissReports(item.post.id)} variant="outline" className="flex-1">
                      Dismiss Reports
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
