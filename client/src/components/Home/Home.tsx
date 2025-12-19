import Link from "next/link"

export default function Hero() {
  return (
    <div className="min-h-screen bg-background">

      <main>
        {/* Hero Section */}
        <section className="pt-20 pb-16 md:pt-32 md:pb-24 bg-background to-muted/20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <h1 className="text-5xl md:text-7xl font-bold text-balance text-foreground leading-tight">
                Make viral production-level animations in seconds.
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
                Create professional motion graphics without the complexity. Choose from pre-designed templates,
                customize in seconds, and export stunning videos ready to share.
              </p>
              <div className="pt-4">
                <Link
                  href="/signup"
                  className="inline-block px-8 py-4 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl transition-all hover:scale-105 shadow-lg shadow-primary/25"
                >
                  Start Creating
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Video Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="relative aspect-video rounded-2xl bg-linear-to-br from-primary/20 to-purple-600/20 border-2 border-primary/30 overflow-hidden shadow-2xl">
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                  <div className="w-20 h-20 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/40 flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-primary" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">Sales pitch video here</h3>
                  <p className="text-muted-foreground max-w-md">
                    Watch how easy it is to create professional animations
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="mt-12 text-center space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                  Templates are pre-designed and animated
                </h2>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                  Every template is professionally crafted by motion designers. Simply pick your style, customize the
                  text, colors, and logo, then export. No animation experience needed.
                </p>
                <div className="pt-4">
                  <Link
                    href="/templates"
                    className="inline-block px-6 py-3 text-base font-medium border-2 border-border hover:border-primary bg-background text-foreground hover:bg-accent rounded-lg transition-colors"
                  >
                    Browse Templates
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
