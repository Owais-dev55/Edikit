export const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

export const plans = [
  {
    id: "prod_TffitWtEKT88s6",
    name: "Free",
    planType: "FREE",
    price: "$0",
    period: "forever",
    description: "Perfect for trying out Edikit",
    features: ["3 video renders per month", "720p resolution",".mp4 format"],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    id: "prod_Tffkh0QPN6G92B",
    name: "Basic",
    planType: "BASIC",
    price: "$5.99",
    period: "per month",
    description: "For professionals and content creators",
    features: [
      "50 video renders per month",
      "1080p HD resolution",
    ".mp4 and .mov formats",
      "with transparent background",
    ],
    cta: "Select Plan",
    popular: true,
  },
  {
    id: "prod_TffnEJPkjRMHpY",
    name: "Pro",
    planType: "PRO",
    price: "$39.99",
    period: "per month",
    description: "For teams and agencies",
    features: [
      "500 video renders per month",
      "4K resolution",
      ".mp4 and .mov formats",
      "with transparent background",
    ],
    cta: "Select Plan",
    popular: false,
  },
];

export const categories = [
  "All",
  "Marketing",
  "Social",
  "Branding",
  "Events",
  "Technology",
];

export interface Template {
  id: number;
  name: string;
  description: string;
  previewUrl: string;
  thumbnail?: string;
  category: string;
  fields: {
    [key: string]: {
      type: "text" | "image" | "video";
      label: string;
      maxLength?: number;
      dimensions?: string;
      required: boolean;
    };
  };
}

export const templates: Template[] = [
  {
    id: 1,
    name: "Animation 1",
    description: "Image & Text Template",
    previewUrl: "/previews/animation-1.mp4",
    thumbnail: "/previews/animation 1.png", // Use video as thumbnail
    category: "Social Media",
    fields: {
      text1: { type: "text", label: "Text 1", maxLength: 13, required: true },
      text2: { type: "text", label: "Text 2", maxLength: 13, required: true },
      image1: { type: "image", label: "Image 1", dimensions: "1080x1080-1920x1920", required: false },
      image2: { type: "image", label: "Image 2", dimensions: "1080x1080-1920x1920", required: false },
      background: { type: "image", label: "Background", dimensions: "", required: false },
    }
  },
  {
    id: 2,
    name: "Animation 2",
    description: "Icon & Text Template",
    previewUrl: "/previews/animation-2.mp4",
    thumbnail: "/previews/animation 2.png",
    category: "Social Media",
    fields: {
      text1: { type: "text", label: "Text 1", maxLength: 20, required: true },
      icon1: { type: "image", label: "Icon 1", dimensions: "800x800-1920x1920", required: false },
      icon2: { type: "image", label: "Icon 2", dimensions: "800x800-1920x1920", required: false },
      background: { type: "image", label: "Background", dimensions: "", required: false },
    }
  },
  {
    id: 3,
    name: "Animation 3",
    description: "Icon & Text Template",
    previewUrl: "/previews/animation-3.mp4",
    thumbnail: "/previews/animation 3.png",
    category: "Social Media",
    fields: {
      icon1: { type: "image", label: "Icon 1", dimensions: "800x800-1920x1920", required: false },
      text1: { type: "text", label: "Text 1", maxLength: 8, required: true },
      text2: { type: "text", label: "Text 2", maxLength: 8, required: true },
      background: { type: "image", label: "Background", dimensions: "1980x1980", required: false },
    }
  },
  {
    id: 4,
    name: "Animation 4",
    description: "Multiple Icons & Text",
    previewUrl: "/previews/animation-4.mp4",
    thumbnail: "/previews/animation 4.png",
    category: "Social Media",
    fields: {
      text1: { type: "text", label: "Text 1", maxLength: 22, required: true },
      icon1: { type: "image", label: "Icon 1", dimensions: "800x800-1920x1920", required: false },
      icon2: { type: "image", label: "Icon 2", dimensions: "800x800-1920x1920", required: false },
      icon3: { type: "image", label: "Icon 3", dimensions: "800x800-1920x1920", required: false },
      background: { type: "image", label: "Background", dimensions: "1080x1920", required: false },
    }
  },
  {
    id: 5,
    name: "Animation 5",
    description: "Two Icons & Text",
    previewUrl: "/previews/animation-5.mp4",
    thumbnail: "/previews/animation 5.png",
    category: "Social Media",
    fields: {
      text1: { type: "text", label: "Text 1", maxLength: 15, required: true },
      text2: { type: "text", label: "Text 2", maxLength: 9, required: true },
      icon1: { type: "image", label: "Icon 1", dimensions: "800x800-1920x1920", required: false },
      icon2: { type: "image", label: "Icon 2", dimensions: "800x800-1920x1920", required: false },
      background: { type: "image", label: "Background", dimensions: "1080x1920", required: false },
    }
  },
  {
    id: 6,
    name: "Animation 6",
    description: "Video & Text Template",
    previewUrl: "/previews/animation-6.mp4",
    thumbnail: "/previews/animation 6.png",
    category: "Video",
    fields: {
      text1: { type: "text", label: "Text 1", maxLength: 15, required: true },
      text2: { type: "text", label: "Text 2", maxLength: 15, required: true },
      text3: { type: "text", label: "Text 3", maxLength: 15, required: true },
      text4: { type: "text", label: "Text 4", maxLength: 15, required: true },
      video1: { type: "video", label: "Video 1", dimensions: "1080x1920", required: false },
      background: { type: "image", label: "Background", dimensions: "1080x1920", required: false },
    }
  },
  {
    id: 7,
    name: "Animation 7",
    description: "Simple Text Template",
    previewUrl: "/previews/animation-7.mp4",
    thumbnail: "/previews/animation 7.png",
    category: "Social Media",
    fields: {
      text1: { type: "text", label: "Text 1", maxLength: 14, required: true },
      text2: { type: "text", label: "Text 2", maxLength: 8, required: true },
      text3: { type: "text", label: "Text 3", maxLength: 16, required: true },
      background: { type: "image", label: "Background", dimensions: "1080x1920", required: false },
    }
  },
  {
    id: 8,
    name: "Animation 8",
    description: "Product Showcase",
    previewUrl: "/previews/animation-8.mp4",
    thumbnail: "/previews/animation 8.png",
    category: "E-commerce",
    fields: {
      image: { type: "image", label: "Product Image", dimensions: "1080x1920", required: false },
      text1: { type: "text", label: "Text 1", maxLength: 15, required: true },
      text2: { type: "text", label: "Text 2", maxLength: 12, required: true },
      text3: { type: "text", label: "Text 3", maxLength: 30, required: true },
      background: { type: "image", label: "Background", dimensions: "1080x1920", required: false },
    }
  },
  {
    id: 9,
    name: "Animation 9",
    description: "Triple Text Template",
    previewUrl: "/previews/animation-9.mp4",
    thumbnail: "/previews/animation 9.png",
    category: "Social Media",
    fields: {
      text1: { type: "text", label: "Text 1", maxLength: 15, required: true },
      text2: { type: "text", label: "Text 2", maxLength: 15, required: true },
      text3: { type: "text", label: "Text 3", maxLength: 15, required: true },
      background: { type: "image", label: "Background", dimensions: "1080x1920", required: false },
    }
  },
  {
    id: 10,
    name: "Animation 10",
    description: "Four Icons & Text",
    previewUrl: "/previews/animation-10.mp4",
    thumbnail: "/previews/animation 10.png",
    category: "Social Media",
    fields: {
      icon1: { type: "image", label: "Icon 1", dimensions: "800x800-1920x1920", required: false },
      icon2: { type: "image", label: "Icon 2", dimensions: "800x800-1920x1920", required: false },
      icon3: { type: "image", label: "Icon 3", dimensions: "800x800-1920x1920", required: false },
      icon4: { type: "image", label: "Icon 4", dimensions: "800x800-1920x1920", required: false },
      text1: { type: "text", label: "Text 1", maxLength: 16, required: true },
      background: { type: "image", label: "Background", dimensions: "1080x1920", required: false },
    }
  },
  {
    id: 11,
    name: "Animation 11",
    description: "Social Media Style",
    previewUrl: "/previews/animation-11.mp4",
    thumbnail: "/previews/animation 11.png",
    category: "Social Media",
    fields: {
      icon1: { type: "image", label: "Profile Icon", dimensions: "800x800-1920x1920", required: false },
      text1: { type: "text", label: "Username", maxLength: 13, required: true },
      video1: { type: "video", label: "Video 1", dimensions: "1080x1920", required: false },
      text2: { type: "text", label: "Text 2", maxLength: 9, required: true },
      background: { type: "image", label: "Background", dimensions: "1080x1920", required: false },
    }
  },
];