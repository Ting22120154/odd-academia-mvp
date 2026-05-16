import { PrismaClient } from "@prisma/client";
import { neon } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";

const sql = neon(process.env.DATABASE_URL!);
const adapter = new PrismaNeon(sql);
const prisma = new PrismaClient({ adapter });

const interests = [
  { name: "AI",                   icon: "🤖" },
  { name: "Biohacking",           icon: "🧬" },
  { name: "Business",             icon: "💼" },
  { name: "Design",               icon: "🎨" },
  { name: "Education",            icon: "🎓" },
  { name: "Engineering/Robotics", icon: "⚙️" },
  { name: "Fashion",              icon: "👗" },
  { name: "Gastronomy",           icon: "🍳" },
  { name: "Health",               icon: "🏥" },
  { name: "History",              icon: "📜" },
  { name: "Lifestyle/Culture",    icon: "🌐" },
  { name: "Maths",                icon: "➗" },
  { name: "Music",                icon: "🎵" },
  { name: "Nature",               icon: "🌿" },
  { name: "Politics",             icon: "🗳️" },
  { name: "Pop Culture",          icon: "🎬" },
  { name: "Sports",               icon: "⚽" },
  { name: "Technology",           icon: "💻" },
];

async function main() {
  for (const interest of interests) {
    await prisma.interest.upsert({
      where:  { name: interest.name },
      update: {},
      create: interest,
    });
  }
  console.log(`Seeded ${interests.length} interests.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
