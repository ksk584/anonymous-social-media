import { Header } from "@/components/header"
import { Feed } from "@/components/feed"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <Feed />
    </main>
  )
}
