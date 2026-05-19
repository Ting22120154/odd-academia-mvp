/**
 * Full database seed.
 *
 * Usage (from repo root):   pnpm db:seed
 * Usage (from packages/db): pnpm db:seed
 *
 * Order:
 *   1. Clear all tables (FK-safe, reverse dependency order)
 *   2. Interests
 *   3. Admin user (User row with role "admin" + linked AdminUser row)
 *   4. Public users
 *   5. Papers  (+ PaperKeyword, PaperCategory rows)
 *   6. Comments + replies (isFlagged replies become CommentReport rows)
 *   7. Sample follows
 */

import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import {
  interests,
  adminSeedUser,
  adminPanelPassword,
  users,
  papers,
  comments,
} from "./data"

const prisma = new PrismaClient()
const SALT   = 10

async function main() {
  console.log("🌱  Seeding database…\n")

  // ── 1. Clear existing data ──────────────────────────────────────────────────
  await prisma.commentReport.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.paperReference.deleteMany()
  await prisma.paperContributor.deleteMany()
  await prisma.paperCategory.deleteMany()
  await prisma.paperKeyword.deleteMany()
  await prisma.paper.deleteMany()
  await prisma.message.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.notificationSettings.deleteMany()
  await prisma.follow.deleteMany()
  await prisma.userInterest.deleteMany()
  await prisma.adminUser.deleteMany()
  await prisma.user.deleteMany()
  await prisma.interest.deleteMany()
  console.log("  ✓ Cleared all tables")

  // ── 2. Interests ────────────────────────────────────────────────────────────
  const createdInterests = await Promise.all(
    interests.map((i) =>
      prisma.interest.create({ data: i })
    )
  )
  console.log(`  ✓ ${createdInterests.length} interests`)

  // ── 3. Admin user ───────────────────────────────────────────────────────────
  // AdminUser references a User row, so create the User first.
  const adminHash = await bcrypt.hash(adminSeedUser.password, SALT)
  const adminUser = await prisma.user.create({
    data: {
      fullName:         adminSeedUser.fullName,
      username:         adminSeedUser.username,
      email:            adminSeedUser.email,
      passwordHash:     adminHash,
      role:             adminSeedUser.role,
      profileVisibility: adminSeedUser.profileVisibility,
      isEmailVerified:  adminSeedUser.isEmailVerified,
    },
  })
  const adminPanelHash = await bcrypt.hash(adminPanelPassword, SALT)
  await prisma.adminUser.create({
    data: {
      userId:       adminUser.id,
      adminEmail:   adminSeedUser.email,
      passwordHash: adminPanelHash,
    },
  })
  console.log(`  ✓ Admin user: ${adminSeedUser.email}`)

  // ── 4. Public users ─────────────────────────────────────────────────────────
  const createdUsers = await Promise.all(
    users.map(async (u: typeof users[number]) => {
      const { password, ...rest } = u
      return prisma.user.create({
        data: { ...rest, passwordHash: await bcrypt.hash(password, SALT) },
      })
    })
  )
  // username → User lookup for subsequent steps
  const byUsername = Object.fromEntries(
    createdUsers.map((u) => [u.username, u])
  )
  console.log(`  ✓ ${createdUsers.length} public users`)

  // ── 5. Papers ───────────────────────────────────────────────────────────────
  const createdPapers: { id: string }[] = []
  for (const p of papers) {
    const author = byUsername[p.authorUsername]
    if (!author) throw new Error(`Unknown authorUsername: ${p.authorUsername}`)

    const paper = await prisma.paper.create({
      data: {
        authorId:    author.id,
        title:       p.title,
        abstract:    p.abstract,
        publishedAt: p.publishedAt,
        viewCount:   p.viewCount,
        status:      "published",
        keywords: {
          create: p.keywords.map((k) => ({ keyword: k })),
        },
        categories: {
          create: p.categories.map((c) => ({ category: c })),
        },
      },
    })
    createdPapers.push(paper)
  }
  console.log(`  ✓ ${createdPapers.length} papers`)

  // ── 6. Comments + replies ───────────────────────────────────────────────────
  let commentCount  = 0
  let reportCount   = 0

  for (const c of comments) {
    const author = byUsername[c.authorUsername]
    const paper  = createdPapers[c.paperIndex]
    if (!author) throw new Error(`Unknown authorUsername: ${c.authorUsername}`)
    if (!paper)  throw new Error(`Unknown paperIndex: ${c.paperIndex}`)

    const topLevel = await prisma.comment.create({
      data: { content: c.content, authorId: author.id, paperId: paper.id },
    })
    commentCount++

    for (const r of c.replies) {
      const replyAuthor = byUsername[r.authorUsername]
      if (!replyAuthor) throw new Error(`Unknown reply author: ${r.authorUsername}`)

      const reply = await prisma.comment.create({
        data: {
          content:   r.content,
          authorId:  replyAuthor.id,
          paperId:   paper.id,
          parentId:  topLevel.id,
          isFlagged: r.isFlagged,
        },
      })
      commentCount++

      // Flagged replies get a CommentReport using the exact reporter + reason from data.ts
      if (r.isFlagged) {
        const reporter = byUsername[r.reportedByUsername!]
        if (!reporter) throw new Error(`Unknown reportedByUsername: ${r.reportedByUsername}`)
        await prisma.commentReport.create({
          data: {
            commentId:  reply.id,
            reporterId: reporter.id,
            reason:     r.reason!,
          },
        })
        reportCount++
      }
    }
  }
  console.log(`  ✓ ${commentCount} comments / replies`)
  console.log(`  ✓ ${reportCount} comment reports (Pending)`)

  // ── 7. Sample follows ───────────────────────────────────────────────────────
  const followPairs = [
    ["ricksmith", "ev_harper"],
    ["ev_harper",  "jamesb"   ],
    ["joerash",   "ev_harper"],
    ["stevensam", "ev_harper"],
  ]
  for (const [followerId, followingId] of followPairs) {
    const f = byUsername[followerId]
    const g = byUsername[followingId]
    if (f && g) {
      await prisma.follow.create({
        data: { followerId: f.id, followingId: g.id },
      })
    }
  }
  console.log("  ✓ Sample follows")

  console.log("\n✅  Seed complete.")
}

main()
  .catch((e) => {
    console.error("❌  Seed failed:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
