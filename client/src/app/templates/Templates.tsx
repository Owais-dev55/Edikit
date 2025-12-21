import { categories, templates } from "@/utils/constant";
import { Play, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const Templates = () => {
  return (
    <section className="relative py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-7xl space-y-10">
          {/* Header */}
          <div className="space-y-3 text-center">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Templates
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Choose a template, customize it, and generate a video in seconds.
            </p>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between rounded-xl border bg-card p-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                placeholder="Search templates..."
                className="w-full h-10 rounded-md border border-border bg-background pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => (
                <button
                  key={category}
                  className={`h-9 rounded-full px-4 text-sm transition-colors
                    ${
                      category === "All"
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-background hover:bg-muted"
                    }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Templates Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Link key={template.id} href={`/customize/${template.id}`}>
                <div className="group relative overflow-hidden rounded-xl border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10">
                  {/* Thumbnail */}
                  <div className="relative aspect-4/3 overflow-hidden bg-muted">
                    <Image
                      src={template.thumbnail || "/placeholder.svg"}
                      alt={template.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      width={200}
                      height={200}
                    />

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary">
                        <Play className="h-6 w-6 fill-primary-foreground text-primary-foreground ml-0.5" />
                      </div>
                    </div>

                    {/* Duration Badge */}
                    <span className="absolute right-3 top-3 rounded-full bg-background/80 px-3 py-1 text-xs backdrop-blur">
                      {template.duration}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="space-y-2 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold leading-tight transition-colors group-hover:text-primary">
                        {template.title}
                      </h3>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                        {template.category}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Customizable motion template ready to render.
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Templates;
