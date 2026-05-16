/**
 * Canonical mock data for Odd Academia.
 *
 * Field names match the Prisma schema in packages/db/prisma/schema.prisma.
 * Passwords are stored in plain text here and hashed with bcrypt in seed.ts.
 *
 * Source mappings:
 *   admin/src/app/(admin)/users/page.tsx        → users[]
 *   admin/src/app/(admin)/papers/page.tsx       → papers[]
 *   admin/src/app/(admin)/papers/[id]/page.tsx  → comments[]
 *   frontend onboarding interests               → interests[]
 */

// ── Interests ────────────────────────────────────────────────────────────────
// Matches prisma/seed.ts from addLoginPage branch
export const interests = [
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
]

// ── Admin credentials ────────────────────────────────────────────────────────
// AdminUser is linked to a User row — the admin is first a User with role "admin".
export const adminSeedUser = {
  fullName:         "Admin",
  username:         "oddacademia_admin",
  email:            "admin@oddacademia.com",
  password:         "Admin@1234",       // hashed in seed.ts
  role:             "admin" as const,
  profileVisibility: true,
  isEmailVerified:  true,
}

// Admin-panel password (stored separately in AdminUser.passwordHash)
export const adminPanelPassword = "Admin@1234"

// ── Public users ─────────────────────────────────────────────────────────────
// 12 rows — matches HARDCODED_USERS in admin/src/app/(admin)/users/page.tsx.
// WorkStatus values: "open" | "not_open" | "freelance" | "none"
export const users = [
  {
    fullName:          "Rick Smith",
    username:          "ricksmith",
    email:             "rick.smith@example.com",
    password:          "Password@1",
    workStatus:        "open"      as const,
    profileVisibility: true,
    jobTitle:          "Software Engineer",
    isEmailVerified:   true,
    createdAt:         new Date("2025-01-29"),
  },
  {
    fullName:          "Evelyn Harper",
    username:          "ev_harper",
    email:             "evharper@gmail.com",
    password:          "Password@1",
    workStatus:        "freelance" as const,
    profileVisibility: true,
    jobTitle:          "Data Scientist",
    bio:               "Dr. Evelyn Harper is a passionate advocate for sustainable energy, with a strong focus on renewable technologies. She has written extensively on the subject and is a sought-after speaker at events promoting green energy solutions.",
    githubUrl:         "https://github.com/evharper",
    linkedinUrl:       "https://linkedin.com/in/evharper",
    isEmailVerified:   true,
    createdAt:         new Date("2025-01-29"),
  },
  {
    fullName:          "James B",
    username:          "jamesb",
    email:             "james.b@example.com",
    password:          "Password@1",
    workStatus:        "none"      as const,
    profileVisibility: true,
    jobTitle:          "Researcher",
    isEmailVerified:   true,
    createdAt:         new Date("2025-01-29"),
  },
  {
    fullName:          "Steven Sam",
    username:          "stevensam",
    email:             "steven.sam@example.com",
    password:          "Password@1",
    workStatus:        "open"      as const,
    profileVisibility: true,
    jobTitle:          "Environmental Scientist",
    isEmailVerified:   true,
    createdAt:         new Date("2025-01-29"),
  },
  {
    fullName:          "Joe Rash",
    username:          "joerash",
    email:             "joe.rash@example.com",
    password:          "Password@1",
    workStatus:        "none"      as const,
    profileVisibility: true,
    jobTitle:          "PhD Student",
    isEmailVerified:   true,
    createdAt:         new Date("2025-01-29"),
  },
  {
    fullName:          "Will Copper",
    username:          "willcopper",
    email:             "will.copper@example.com",
    password:          "Password@1",
    workStatus:        "not_open"  as const,
    profileVisibility: true,
    jobTitle:          "Lecturer",
    isEmailVerified:   true,
    createdAt:         new Date("2025-01-29"),
  },
  {
    fullName:          "Chris Jr",
    username:          "chrisjr",
    email:             "chris.jr@example.com",
    password:          "Password@1",
    workStatus:        "none"      as const,
    profileVisibility: true,
    jobTitle:          "MSc Student",
    isEmailVerified:   true,
    createdAt:         new Date("2025-01-29"),
  },
  {
    fullName:          "Trisha Crady",
    username:          "tcrady",
    email:             "trisha.crady@example.com",
    password:          "Password@1",
    workStatus:        "open"      as const,
    profileVisibility: true,
    jobTitle:          "Research Analyst",
    isEmailVerified:   true,
    createdAt:         new Date("2025-01-29"),
  },
  {
    fullName:          "Reuben Max",
    username:          "reubenmax",
    email:             "reuben.max@example.com",
    password:          "Password@1",
    workStatus:        "not_open"  as const,
    profileVisibility: true,
    jobTitle:          "Associate Professor",
    isEmailVerified:   true,
    createdAt:         new Date("2025-01-29"),
  },
  {
    fullName:          "Tanya Ross",
    username:          "tanyaross",
    email:             "tanya.ross@example.com",
    password:          "Password@1",
    workStatus:        "open"      as const,
    profileVisibility: true,
    jobTitle:          "Energy Consultant",
    isEmailVerified:   true,
    createdAt:         new Date("2025-01-29"),
  },
  {
    fullName:          "Betty B",
    username:          "bettyb",
    email:             "betty.b@example.com",
    password:          "Password@1",
    workStatus:        "open"      as const,
    profileVisibility: true,
    jobTitle:          "Climate Scientist",
    isEmailVerified:   true,
    createdAt:         new Date("2025-01-29"),
  },
  {
    fullName:          "Sue Lee",
    username:          "sulee",
    email:             "sue.lee@example.com",
    password:          "Password@1",
    workStatus:        "not_open"  as const,
    profileVisibility: false,
    jobTitle:          "Independent Researcher",
    isEmailVerified:   true,
    createdAt:         new Date("2025-01-29"),
  },
]

// ── Papers ───────────────────────────────────────────────────────────────────
// authorUsername resolved to User.id in seed.ts.
// keywords and categories are created as related PaperKeyword / PaperCategory rows.
export const papers = [
  {
    authorUsername: "ev_harper",
    title:       "Sustainable Energy Practices in Urban Environments",
    abstract:    "This research paper thoroughly examines Sustainable Energy Practices in Urban Environments. It extensively discusses the challenges and opportunities associated with implementing sustainable energy systems in urban settings, taking into account factors like resource availability, infrastructure, and community engagement.",
    keywords:    ["Sustainable energy", "AI infrastructure", "Urban planning"],
    categories:  ["Sustainable Energy"],
    publishedAt: new Date("2025-01-29"),
    viewCount:   3023,
  },
  {
    authorUsername: "ev_harper",
    title:       "Innovative Solar Power Solutions for Urban Communities",
    abstract:    "An exploration of cutting-edge solar panel designs and deployment strategies tailored for dense urban environments.",
    keywords:    ["Solar energy", "Urban planning", "Photovoltaics"],
    categories:  ["AI Infrastructure"],
    publishedAt: new Date("2025-01-29"),
    viewCount:   2874,
  },
  {
    authorUsername: "stevensam",
    title:       "Revolutionising Wind Energy Practices in Urban Settings",
    abstract:    "Examining how modern small-scale wind turbines can be integrated into city infrastructure without visual or acoustic impact.",
    keywords:    ["Wind energy", "Computer Science", "Urban design"],
    categories:  ["AI Infrastructure"],
    publishedAt: new Date("2025-01-29"),
    viewCount:   2100,
  },
  {
    authorUsername: "stevensam",
    title:       "Efficient Waste-to-Energy Solutions for Urban Environments",
    abstract:    "A study on converting urban waste streams into viable energy using modern thermochemical and biological conversion technologies.",
    keywords:    ["Waste management", "Data Science", "Bioenergy"],
    categories:  ["AI Infrastructure"],
    publishedAt: new Date("2025-01-29"),
    viewCount:   1950,
  },
  {
    authorUsername: "jamesb",
    title:       "Biofuel Production Methods and Environmental Impact",
    abstract:    "Comparative analysis of first-, second-, and third-generation biofuel production pathways and their net environmental footprint.",
    keywords:    ["Biofuel", "Environment", "Life-cycle analysis"],
    categories:  ["Sustainable Energy"],
    publishedAt: new Date("2025-01-29"),
    viewCount:   1700,
  },
  {
    authorUsername: "tanyaross",
    title:       "Green Hydrogen: The Future of Clean Energy Storage",
    abstract:    "An overview of green hydrogen production via electrolysis and its role in solving long-duration energy storage challenges.",
    keywords:    ["Hydrogen", "Clean energy", "Electrolysis"],
    categories:  ["Sustainable Energy"],
    publishedAt: new Date("2025-01-29"),
    viewCount:   1500,
  },
  {
    authorUsername: "bettyb",
    title:       "Carbon Capture Technologies for Urban Industrial Areas",
    abstract:    "Review of direct air capture and point-source capture technologies applicable in urban industrial corridors.",
    keywords:    ["Carbon capture", "Industry", "Climate"],
    categories:  ["Sustainable Energy"],
    publishedAt: new Date("2025-01-29"),
    viewCount:   1350,
  },
  {
    authorUsername: "tcrady",
    title:       "Smart Grid Technology and Urban Energy Efficiency",
    abstract:    "How AI-driven smart grid systems are optimising real-time energy distribution and reducing waste in modern cities.",
    keywords:    ["Smart grid", "AI", "Energy efficiency"],
    categories:  ["Sustainable Energy"],
    publishedAt: new Date("2025-01-29"),
    viewCount:   1200,
  },
  {
    authorUsername: "ricksmith",
    title:       "Urban Heat Islands and Passive Cooling Strategies",
    abstract:    "Analysis of the urban heat island effect and evidence-based passive cooling design strategies for architects and city planners.",
    keywords:    ["Urban heat", "Passive cooling", "Architecture"],
    categories:  ["Sustainable Energy"],
    publishedAt: new Date("2025-01-29"),
    viewCount:   1000,
  },
  {
    authorUsername: "joerash",
    title:       "The Role of AI in Accelerating Renewable Energy Adoption",
    abstract:    "How machine learning and AI forecasting tools are being deployed to accelerate global adoption of wind, solar, and storage.",
    keywords:    ["AI", "Renewable energy", "Machine learning"],
    categories:  ["AI Infrastructure"],
    publishedAt: new Date("2025-01-29"),
    viewCount:   900,
  },
]

// ── Comments ─────────────────────────────────────────────────────────────────
// paperIndex = index into papers[] above.
// isFlagged = true means shown in admin notification bell (Pending Review).
export const comments = [
  {
    paperIndex:     0,
    authorUsername: "jamesb",
    content:        "The paper offers some insightful perspectives on sustainable energy, but I feel like it underestimates the challenges of implementing these practices in older urban infrastructures. How can cities retrofit without massive costs or disruptions?",
    replies: [
      {
        authorUsername: "tcrady",
        content:        "That's a valid point. The paper does touch on retrofitting but focuses more on policy frameworks. Maybe the authors could have explored case studies on cities that have successfully integrated these changes without major disruptions?",
        isFlagged:      true,  // reported — appears in admin bell
      },
      {
        authorUsername: "joerash",
        content:        "Agreed, that would have been helpful. I'd be interested to see more specific examples of how financial incentives are making retrofits more feasible for ageing cities.",
        isFlagged:      false,
      },
    ],
  },
  {
    paperIndex:     0,
    authorUsername: "jamesb",
    content:        "While I appreciate the paper's approach to sustainable energy in urban settings, it seems to overlook some critical aspects of energy storage. How does this paper address those concerns?",
    replies: [
      {
        authorUsername: "tcrady",
        content:        "Thank you for bringing up QA — Urban Landscape Transformations! We do acknowledge the importance of energy storage, though it wasn't a focal point in this paper. Our intention was to first address foundational energy distribution and consumption patterns.",
        isFlagged:      true,  // reported — appears in admin bell
      },
    ],
  },
  {
    paperIndex:     0,
    authorUsername: "stevensam",
    content:        "While I appreciate the paper's approach, it seems to overlook some critical aspects of energy storage. As referenced in the study by Patel et al. (2022), energy storage systems are key to mitigating intermittent renewable energy supply.",
    replies: [
      {
        authorUsername: "jamesb",
        content:        "While I appreciate the paper's approach to sustainable energy in urban environments, it seems to overlook some critical aspects of energy storage.",
        isFlagged:      true,  // reported — appears in admin bell
      },
    ],
  },
]
