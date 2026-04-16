export type PostCategory =
  | "Trending"
  | "Biohacking"
  | "Maths"
  | "Sustainability"
  | "Technology"
  | "AI"
  | "Business";

export type MockPost = {
  id: string;
  title: string;
  description: string;
  category: PostCategory;
  tags: string[];
  author: { name: string; avatarUrl?: string };
  image: { alt: string; src: string };
};

export const CATEGORIES: PostCategory[] = [
  "Trending",
  "Biohacking",
  "Maths",
  "Sustainability",
  "Technology",
  "AI",
  "Business",
];

export const mockPosts: MockPost[] = [
  {
    id: "1",
    title: "Sustainable Energy Practices in Urban Environments",
    description: "Introducing our latest paper on cleaner, smarter cities.",
    category: "Trending",
    tags: ["AI infrastructure", "Computer science"],
    author: { name: "James B.", avatarUrl: "/avatars/avatar-1.svg" },
    image: { alt: "City skyline", src: "/post-thumbs/thumb-1.svg" },
  },
  {
    id: "2",
    title: "Optimising Energy Consumption in Smart Cities",
    description: "Presenting a comprehensive study on energy efficiency.",
    category: "Technology",
    tags: ["Smart grid", "Renewable energy sources"],
    author: { name: "Alex C.", avatarUrl: "/avatars/avatar-2.svg" },
    image: { alt: "Futuristic city", src: "/post-thumbs/thumb-2.svg" },
  },
  {
    id: "3",
    title: "Electric Vehicles inside of Your City",
    description: "Exploring the impact of electric mobility on urban life.",
    category: "Business",
    tags: ["Public transportation", "Charging infrastructure"],
    author: { name: "Emily D.", avatarUrl: "/avatars/avatar-3.svg" },
    image: { alt: "EV charging", src: "/post-thumbs/thumb-3.svg" },
  },
  {
    id: "4",
    title: "Implementing Green Building Solutions ...",
    description: "Detailing the integration of green building solutions.",
    category: "Sustainability",
    tags: ["Eco-friendly materials", "Energy-efficient design"],
    author: { name: "Michael H.", avatarUrl: "/avatars/avatar-4.svg" },
    image: { alt: "Modern building", src: "/post-thumbs/thumb-4.svg" },
  },
  {
    id: "5",
    title: "Wearable Biomarkers for Stress & Recovery",
    description: "A practical overview of signals, noise, and measurement.",
    category: "Biohacking",
    tags: ["HRV", "Sleep", "Sensors"],
    author: { name: "Riya S.", avatarUrl: "/avatars/avatar-5.svg" },
    image: { alt: "Abstract sensors", src: "/post-thumbs/thumb-5.svg" },
  },
  {
    id: "6",
    title: "Mathematical Intuition for Optimization",
    description: "A friendly guide to gradients, convexity, and constraints.",
    category: "Maths",
    tags: ["Convexity", "Gradients", "Proofs"],
    author: { name: "Noah K.", avatarUrl: "/avatars/avatar-6.svg" },
    image: { alt: "Abstract graph", src: "/post-thumbs/thumb-6.svg" },
  },
];
