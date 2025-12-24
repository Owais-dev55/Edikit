import Image from "next/image";
import Link from "next/link";

interface TemplateCardProps {
  id: number;
  title: string;
  thumbnail: string;
  category: string;
  isFeatured?: boolean;
}

export default function Card({
  id,
  title,
  thumbnail,
  isFeatured = false,
}: TemplateCardProps) {
  return (
    <Link href={`/customize/${id}`}>
      <div
        className={`group h-full rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer ${
          isFeatured
            ? "border-primary/50 bg-linear-to-br from-card to-card/80 shadow-2xl shadow-primary/20 hover:shadow-3xl hover:shadow-primary/30 hover:border-primary"
            : "border-border bg-card hover:border-primary/50 shadow-lg hover:shadow-xl hover:shadow-primary/10"
        }`}
      >
        {/* Thumbnail */}
        <div
          className={`relative w-full bg-muted overflow-hidden ${
            isFeatured ? "aspect-video h-80" : "aspect-video h-56"
          }`}
        >
          <Image
            src={thumbnail || "/placeholder.svg"}
            alt={title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
            unoptimized
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Content */}
        <div className={`space-y-4 ${isFeatured ? "p-8" : "p-6"}`}>
          <div className="space-y-2">
            <h3
              className={`font-bold text-foreground group-hover:text-primary transition-colors ${
                isFeatured ? "text-2xl" : "text-lg"
              }`}
            >
              {title}
            </h3>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <div
              className={`font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity ${
                isFeatured ? "text-base" : "text-sm"
              }`}
            >
              Explore →
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
