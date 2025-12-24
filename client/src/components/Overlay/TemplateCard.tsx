import Image from "next/image";
import Link from "next/link";

interface TemplateCardProps {
  id: number;
  title: string;
  category: string;
  duration: string;
  thumbnail: string;
}

const TemplateCard = ({
  id,
  title,
  category,
  duration,
  thumbnail,
}: TemplateCardProps) => {
  return (
    <div
      key={id}
      className="group relative overflow-hidden rounded-xl border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10"
    >
      {/* Thumbnail */}
      <div className="relative aspect-4/3 overflow-hidden bg-muted">
        <Image
          src={thumbnail || "/placeholder.svg"}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          width={200}
          height={200}
        />

        {/* Hover Overlay */}
        {/* <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary">
                        <Play className="h-6 w-6 fill-primary-foreground text-primary-foreground ml-0.5" />
                      </div>
                    </div> */}

        {/* Duration Badge */}
        <span className="absolute right-3 top-3 rounded-full bg-background/80 px-3 py-1 text-xs backdrop-blur">
          {duration}
        </span>
      </div>

      {/* Content */}
      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold leading-tight transition-colors group-hover:text-primary">
            {title}
          </h3>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
            {category}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Customizable motion template ready to render.
        </p>
        <Link href={`/customize/${id}`}>
          <button className="btn btn-primary w-full h-10 rounded-2xl mt-2 bg-primary/90 hover:bg-primary cursor-pointer">
            Customize
          </button>
        </Link>
      </div>
    </div>
  );
};

export default TemplateCard;
