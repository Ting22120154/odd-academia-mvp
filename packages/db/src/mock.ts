/**
 * Mock data adapter — single source of truth for UI development.
 *
 * Imports raw data from data.ts (which matches the Prisma schema) and exports
 * pre-shaped arrays for each app.  When the real DB is ready, replace these
 * exports with API calls and nothing else in the apps needs to change.
 *
 * Exports:
 *   Admin app  → mockAdminUsers, mockAdminPapers, mockAdminComments, mockFlaggedComments, mockAdminUserDetails
 *   Frontend   → mockFrontendPosts, mockFrontendViewerPosts, mockFrontendCurrentUser
 */

import { users as _rawUsers, papers, comments, citations } from "./data"
import { formatDateAU } from "./date"

// Not all users in data.ts have bio/githubUrl/linkedinUrl (they're optional).
// TypeScript infers a union type for the array, so we widen to a common shape here.
type UserRow = {
  fullName:          string
  username:          string
  email:             string
  workStatus:        "open" | "not_open" | "freelance" | "none"
  profileVisibility: boolean
  jobTitle?:         string
  isEmailVerified:   boolean
  createdAt:         Date
  bio?:              string
  githubUrl?:        string
  linkedinUrl?:      string
}
const users = _rawUsers as UserRow[]

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(date: Date): string {
  return formatDateAU(date)
}

function lookupUser(username: string): string {
  return users.find(u => u.username === username)?.fullName ?? username
}

// Preserved from original HARDCODED_USERS in admin/users/page.tsx.
// These statuses are intentional test states for the admin UI (Active / Inactive / Suspended).
const USER_STATUS: Record<string, "Active" | "Inactive" | "Suspended"> = {
  ricksmith:  "Active",
  ev_harper:  "Inactive",
  jamesb:     "Suspended",
  stevensam:  "Active",
  joerash:    "Active",
  willcopper: "Inactive",
  chrisjr:    "Inactive",
  tcrady:     "Active",
  reubenmax:  "Inactive",
  tanyaross:  "Active",
  bettyb:     "Active",
  sulee:      "Suspended",
}

// Preserved from original HARDCODED_USERS
const USER_SOCIAL: Record<string, { following: number; followers: number }> = {
  ricksmith:  { following: 500, followers: 330 },
  ev_harper:  { following: 10,  followers: 298 },
  jamesb:     { following: 999, followers: 999 },
  stevensam:  { following: 213, followers: 11  },
  joerash:    { following: 22,  followers: 245 },
  willcopper: { following: 0,   followers: 9   },
  chrisjr:    { following: 111, followers: 45  },
  tcrady:     { following: 123, followers: 67  },
  reubenmax:  { following: 32,  followers: 45  },
  tanyaross:  { following: 2,   followers: 100 },
  bettyb:     { following: 234, followers: 112 },
  sulee:      { following: 0,   followers: 0   },
}

// Cited and downloaded counts — not in Prisma schema yet (future: joins on Citation/Download tables)
const PAPER_EXTRA = [
  { cited: 33, downloaded: 343 },
  { cited: 28, downloaded: 312 },
  { cited: 21, downloaded: 290 },
  { cited: 18, downloaded: 267 },
  { cited: 15, downloaded: 243 },
  { cited: 12, downloaded: 220 },
  { cited:  9, downloaded: 196 },
  { cited:  7, downloaded: 173 },
  { cited:  5, downloaded: 150 },
  { cited:  3, downloaded: 126 },
]

// ── Admin: Users list ─────────────────────────────────────────────────────────

export interface AdminUser {
  id:         string
  name:       string
  registered: string
  papers:     number
  following:  number
  followers:  number
  status:     "Active" | "Inactive" | "Suspended"
}

export const mockAdminUsers: AdminUser[] = users.map((u, i) => ({
  id:         String(i + 1),
  name:       u.fullName,
  registered: fmt(u.createdAt),
  papers:     papers.filter(p => p.authorUsername === u.username).length,
  following:  USER_SOCIAL[u.username]?.following ?? 0,
  followers:  USER_SOCIAL[u.username]?.followers ?? 0,
  status:     USER_STATUS[u.username] ?? "Active",
}))

// ── Admin: User detail ────────────────────────────────────────────────────────

export interface AdminUserDetail extends AdminUser {
  username:    string
  email:       string
  jobTitle:    string
  openForWork: boolean
  bio:         string
  githubUrl:   string
  linkedinUrl: string
  metrics: {
    papers:          number
    followers:       string
    followingPapers: number
    citedComments:   number
  }
}

export const mockAdminUserDetails: AdminUserDetail[] = users.map((u, i) => {
  const base        = mockAdminUsers[i]
  const papersCount = base.papers
  const fStr        = base.followers >= 1000
    ? `${(base.followers / 1000).toFixed(1)}k`
    : String(base.followers)
  return {
    ...base,
    username:    `@${u.username}`,
    email:       u.email,
    jobTitle:    u.jobTitle ?? "Researcher",
    openForWork: u.workStatus === "open" || u.workStatus === "freelance",
    bio:         u.bio ?? "",
    githubUrl:   u.githubUrl  ?? "",
    linkedinUrl: u.linkedinUrl ?? "",
    metrics: {
      papers:          papersCount,
      followers:       fStr,
      followingPapers: Math.max(1, Math.floor(base.following / 5)),
      citedComments:   Math.max(0, papersCount * 8),
    },
  }
})

// ── Admin: Papers list ────────────────────────────────────────────────────────

export interface AdminPaper {
  id:         string
  title:      string
  author:     string
  category:   string
  published:  string
  views:      number
  cited:      number
  downloaded: number
  comments:   number
}

export const mockAdminPapers: AdminPaper[] = papers.map((p, i) => {
  const commentCount = comments
    .filter(c => c.paperIndex === i)
    .reduce((sum, c) => sum + 1 + c.replies.length, 0)
  return {
    id:         String(i + 1),
    title:      p.title,
    author:     lookupUser(p.authorUsername),
    category:   p.categories[0] ?? "",
    published:  fmt(p.publishedAt),
    views:      p.viewCount,
    cited:      PAPER_EXTRA[i]?.cited      ?? 0,
    downloaded: PAPER_EXTRA[i]?.downloaded ?? 0,
    comments:   commentCount,
  }
})

// ── Admin: Comments ───────────────────────────────────────────────────────────

export interface AdminCommentReply {
  id:        string
  author:    string
  text:      string
  isFlagged: boolean
  badge?:    "Pending Review"
}

export interface AdminComment {
  id:        string
  paperId:   number   // 0-indexed — matches paperIndex in data.ts
  author:    string
  text:      string
  isFlagged: boolean
  replies:   AdminCommentReply[]
}

export const mockAdminComments: AdminComment[] = comments.map((c, ci) => ({
  id:        `c${ci + 1}`,
  paperId:   c.paperIndex,
  author:    lookupUser(c.authorUsername),
  text:      c.content,
  isFlagged: false,
  replies:   c.replies.map((r, ri) => ({
    id:        `c${ci + 1}r${ri + 1}`,
    author:    lookupUser(r.authorUsername),
    text:      r.content,
    isFlagged: r.isFlagged,
    badge:     r.isFlagged ? "Pending Review" as const : undefined,
  })),
}))

// Flat list of flagged replies for the notification bell
export interface FlaggedComment {
  id:      string
  author:  string
  text:    string
  paperId: string   // 1-indexed string, matches URL /papers/[id]
}

export const mockFlaggedComments: FlaggedComment[] = comments.flatMap((c, ci) =>
  c.replies
    .map((r, ri) => ({ r, ri }))
    .filter(({ r }) => r.isFlagged)
    .map(({ r, ri }) => ({
      id:      `c${ci + 1}r${ri + 1}`,
      author:  lookupUser(r.authorUsername),
      text:    r.content,
      paperId: String(c.paperIndex + 1),
    }))
)

// ── Frontend: PostCard shape ──────────────────────────────────────────────────

type PostCategory = "Trending" | "Biohacking" | "Maths" | "Sustainability" | "Technology" | "AI" | "Business"

function toPostCategory(cat: string): PostCategory {
  const map: Record<string, PostCategory> = {
    "Sustainable Energy": "Sustainability",
    "AI Infrastructure":  "AI",
    "Technology":         "Technology",
    "Biohacking":         "Biohacking",
    "Maths":              "Maths",
    "Business":           "Business",
  }
  return map[cat] ?? "Trending"
}

const AVATAR_URLS = [
  "/avatars/avatar-1.svg", "/avatars/avatar-2.svg", "/avatars/avatar-3.svg",
  "/avatars/avatar-4.svg", "/avatars/avatar-5.svg", "/avatars/avatar-6.svg",
]
const THUMB_URLS = [
  "/post-thumbs/thumb-1.svg", "/post-thumbs/thumb-2.svg", "/post-thumbs/thumb-3.svg",
  "/post-thumbs/thumb-4.svg", "/post-thumbs/thumb-5.svg", "/post-thumbs/thumb-6.svg",
]

export interface FrontendPost {
  id:          string
  title:       string
  description: string
  category:    PostCategory
  tags:        string[]
  author:      { name: string; avatarUrl?: string }
  image:       { alt: string; src: string }
}

export const mockFrontendPosts: FrontendPost[] = papers.map((p, i) => ({
  id:          String(i + 1),
  title:       p.title,
  description: p.abstract.slice(0, 80) + "…",
  category:    toPostCategory(p.categories[0] ?? ""),
  tags:        p.keywords.slice(0, 2),
  author: {
    name:      lookupUser(p.authorUsername),
    avatarUrl: AVATAR_URLS[i % AVATAR_URLS.length],
  },
  image: {
    alt: p.title,
    src: THUMB_URLS[i % THUMB_URLS.length],
  },
}))

// ── Frontend: Paper viewer shape (lib/mockPosts.ts) ───────────────────────────

const GRADIENTS = [
  "bg-gradient-to-br from-orange-300 via-amber-200 to-rose-300",
  "bg-gradient-to-br from-sky-400 via-indigo-400 to-fuchsia-400",
  "bg-gradient-to-br from-emerald-300 via-teal-200 to-cyan-300",
  "bg-gradient-to-br from-pink-300 via-violet-300 to-orange-200",
  "bg-gradient-to-br from-blue-300 via-cyan-200 to-teal-300",
  "bg-gradient-to-br from-purple-300 via-pink-200 to-red-200",
  "bg-gradient-to-br from-yellow-300 via-amber-200 to-orange-200",
  "bg-gradient-to-br from-green-300 via-emerald-200 to-teal-200",
  "bg-gradient-to-br from-indigo-300 via-blue-200 to-sky-200",
  "bg-gradient-to-br from-rose-300 via-red-200 to-orange-200",
]

const DUMMY_PDF = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"

export interface FrontendViewerPost {
  id:                   string
  title:                string
  summary:              string
  authorId?:            string
  authorName:           string
  authorAvatarUrl?:     string
  authorBio?:           string
  authorJobTitle?:      string
  contributors?:        string[]
  subject:              string
  categories?:          string[]
  tags?:                string[]
  fileUrl?:             string
  fileType?:            "pdf" | "docx" | "doc" | "unknown"
  headerGradientClass?: string
  publishedAt?:         string
  citationCount?:       number
  viewCount?:           number
  /** Full abstract text (summary may be truncated for cards). */
  abstract?:            string
  references?:          { id: string; citationText: string }[]
}

export const mockFrontendViewerPosts: FrontendViewerPost[] = papers.map((p, i) => ({
  id:                   String(i + 1),
  title:                p.title,
  summary:              p.abstract.slice(0, 120) + "…",
  authorName:           lookupUser(p.authorUsername),
  subject:              p.categories[0] ?? "",
  tags:                 p.keywords.slice(0, 2),
  fileUrl:              DUMMY_PDF,
  fileType:             "pdf" as const,
  headerGradientClass:  GRADIENTS[i % GRADIENTS.length],
}))

// ── Frontend: Current user (profile shape) ────────────────────────────────────

const WORK_STATUS_LABELS: Record<string, string> = {
  open:      "Open for Work",
  not_open:  "Not Looking",
  freelance: "Freelancing",
  none:      "Student",
}

export interface FrontendUser {
  id:                string
  fullName:          string
  email:             string
  workStatus:        string
  profileVisibility: string
  interests:         string[]
  education:         string
  username:          string
  jobRole:           string
  github:            string
  linkedin:          string
  bio:               string
  avatarUrl?:        string
}

const _rick = users[0]  // Rick Smith — logged-in user for all frontend mock screens

// ── Admin: Reported Comments (mock — swap for API when DB is connected) ───────

export interface AdminReportedComment {
  id:         string
  author:     string
  content:    string
  paperTitle: string
  reportedBy: string
  reason:     string
  reportedAt: Date
}

export const mockAdminReportedComments: AdminReportedComment[] = comments.flatMap((c, ci) =>
  c.replies
    .map((r, ri) => ({ r, ri }))
    .filter(({ r }) => r.isFlagged)
    .map(({ r, ri }) => ({
      id:         `rc${ci + 1}r${ri + 1}`,
      author:     lookupUser(r.authorUsername),
      content:    r.content,
      paperTitle: papers[c.paperIndex]?.title ?? "",
      reportedBy: lookupUser(r.reportedByUsername ?? ""),
      reason:     r.reason ?? "",
      reportedAt: r.reportedAt ?? new Date(),
    }))
).sort((a, b) => b.reportedAt.getTime() - a.reportedAt.getTime())

// ── Admin: Citations ──────────────────────────────────────────────────────────

export interface AdminCitation {
  id:           string
  paperIndex:   number   // 0-based, matches papers[] / mockAdminPapers index
  citingAuthor: string
  citingTitle:  string
  quoteText:    string
}

export const mockAdminCitations: AdminCitation[] = citations.map((c, i) => ({
  id:           `cit${i + 1}`,
  paperIndex:   c.paperIndex,
  citingAuthor: lookupUser(c.citingAuthorUsername),
  citingTitle:  c.citingTitle,
  quoteText:    c.quoteText,
}))

// ── Frontend: Current user (profile shape) ────────────────────────────────────

export const mockFrontendCurrentUser: FrontendUser = {
  id:                "u_1",
  fullName:          _rick.fullName,
  email:             _rick.email,
  workStatus:        WORK_STATUS_LABELS[_rick.workStatus] ?? "Student",
  profileVisibility: _rick.profileVisibility ? "Public" : "Private",
  interests:         ["AI", "Technology"],  // no UserInterest seeded yet — placeholder
  education:         "Bachelor's Degree in Software Engineering",  // not in Prisma schema yet
  username:          _rick.username,
  jobRole:           _rick.jobTitle ?? "Software Engineer",
  github:            _rick.githubUrl  ?? "",
  linkedin:          _rick.linkedinUrl ?? "",
  bio:               _rick.bio ?? "Rick Smith is a visionary in the field of artificial intelligence.",
  avatarUrl:         "/avatars/profile.svg",
}
