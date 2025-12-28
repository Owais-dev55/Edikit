import Link from "next/link"
import { Play } from "lucide-react"
import { templates } from "@/utils/constant"
import Card from "./Card"

export default function Hero() {
  const featuredTemplates = templates.slice(0, 3)

  return (
    <div className="min-h-screen bg-background">
      <main>
        {/* Hero Section - Video/Image on Left, Text on Right */}
        <section className="py-12 md:py-24 bg-background">
          <div className="container mx-auto px-1">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Video Section - Left Side */}
              <div className="order-2 lg:order-1">
                <div className="relative aspect-video rounded-2xl bg-linear-to-br from-primary/20 to-purple-600/20 border-2 border-primary/30 overflow-hidden shadow-2xl hover:shadow-3xl transition-shadow duration-300">
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-linear-to-b from-transparent via-transparent to-black/20">
                    <div className="w-20 h-20 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/40 flex items-center justify-center mb-6 hover:bg-primary/30 transition-colors">
                      <Play className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">See the magic</h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Watch how professionals create stunning animations
                    </p>
                  </div>
                </div>
              </div>

              {/* Text Section - Right Side */}
              <div className="order-1 lg:order-2 space-y-6 px-3">
                <div className="space-y-4">
                  <h1 className="text-4xl md:text-4xl lg:text-5xl font-bold text-balance text-foreground leading-tight ">
                    Make viral production-level animations in
                    <span className="bg-linear-to-r from-primary to-primary/70 bg-clip-text text-transparent ml-2">
                      seconds
                    </span>
                    .
                  </h1>
                  <p className="text-lg md:text-xl text-muted-foreground text-pretty leading-relaxed">
                    Create professional motion graphics without complexity. Choose from stunning pre-designed templates,
                    customize in seconds, and export videos ready to captivate your audience.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <Link
                    href="/templates"
                    className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl transition-all hover:scale-105 shadow-lg shadow-primary/25"
                  >
                    Start Creating
                  </Link>
               
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Templates Section */}
        <section className="py-16 md:py-24 bg-muted/30" id="templates">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              {/* Section Header */}
              <div className="text-center space-y-4 mb-16 md:mb-20">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground text-balance">
                  Templates designed for creators
                </h2>
                <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto text-pretty leading-relaxed">
                  Every template is professionally crafted by motion designers. Customize text, colors, and logos, then
                  export instantly. No animation experience needed.
                </p>
              </div>

              <div className="grid gap-8 mb-12">


                {/* Three Column Layout for Desktop */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Left Side Card */}
                  <div className="md:col-span-1">
                    <Card {...featuredTemplates[0]} />
                  </div>

                  {/* Center Featured Card - Larger */}
                  <div className="md:col-span-1 md:scale-110 md:origin-center">
                    <Card {...featuredTemplates[1]} isFeatured={true} />
                  </div>

                  {/* Right Side Card */}
                  <div className="md:col-span-1">
                    <Card {...featuredTemplates[2]} />
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <div className="flex justify-center pt-8">
                <Link
                  href="/templates"
                  className="inline-flex items-center justify-center px-8 py-4 text-base font-medium border-2 border-border hover:border-primary bg-background text-foreground hover:bg-accent rounded-lg transition-all hover:scale-105"
                >
                  Browse All Templates
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
