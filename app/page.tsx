import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <main className="flex-1 flex flex-col items-center justify-center">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-8 text-center">
              <div className="space-y-4">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Welcome to OM&apos;s Portal
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-400 md:text-xl">
                  Connect with friends in real-time through our secure messaging platform.
                </p>
              </div>
              <div className="space-x-4">
                <Link href="/login">
                  <Button className="bg-white text-black hover:bg-gray-200">Get Started</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

