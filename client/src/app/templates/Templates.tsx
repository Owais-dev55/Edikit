import TemplateCard from "@/components/Overlay/TemplateCard";
import {  templates } from "@/utils/constant";

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
          {/* <div className="flex flex-col md:flex-row gap-4 items-center justify-between rounded-xl border bg-card p-4">
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
          </div> */}

          {/* Templates Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 ">
            {templates.map((template) => (
              <TemplateCard key={template.id} {...template} thumbnail={template.thumbnail || template.previewUrl} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Templates;
