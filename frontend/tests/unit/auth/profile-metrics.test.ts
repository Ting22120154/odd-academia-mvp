import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  paperCount: vi.fn(),
  paperAggregate: vi.fn(),
  paperFollowCount: vi.fn(),
  commentCount: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    paper: {
      count: mocks.paperCount,
      aggregate: mocks.paperAggregate,
    },
    paperFollow: { count: mocks.paperFollowCount },
    comment: { count: mocks.commentCount },
  },
}));

import { loadProfileMetrics } from "@/lib/auth/profile-metrics";

describe("loadProfileMetrics", () => {
  beforeEach(() => {
    mocks.paperCount.mockReset();
    mocks.paperAggregate.mockReset();
    mocks.paperFollowCount.mockReset();
    mocks.commentCount.mockReset();
  });

  it("aggregates profile engagement metrics", async () => {
    mocks.paperCount.mockResolvedValue(4);
    mocks.paperAggregate.mockResolvedValue({ _sum: { viewCount: 50 } });
    mocks.paperFollowCount.mockResolvedValueOnce(3).mockResolvedValueOnce(14);
    mocks.commentCount.mockResolvedValue(5);

    const metrics = await loadProfileMetrics("user-1");
    expect(metrics).toEqual({
      papersPublished: 4,
      paperViews: 50,
      paperFollows: 3,
      commentsOnPapers: 5,
      followedPapers: 14,
    });
  });
});
