/** Shared Prisma include for paper list/detail API and server loaders. */
export const paperInclude = {
  author: {
    select: {
      id: true,
      fullName: true,
      avatarUrl: true,
      bio: true,
      jobTitle: true,
    },
  },
  keywords: true,
  categories: true,
  contributors: true,
  references: true,
} as const;
