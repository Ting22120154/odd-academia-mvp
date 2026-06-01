import { PAPER_CATEGORIES } from "@/lib/papers/categories";

export async function GET() {
  return Response.json({ categories: [...PAPER_CATEGORIES] });
}
