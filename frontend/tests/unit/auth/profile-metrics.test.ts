import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  paperCount: vi.fn(),
  commentLikeCount: vi.fn(),
  paperAggregate: vi.fn(),
  paperFollowCount: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    paper: {
      count: mocks.paperCount,
      aggregate: mocks.paperAggregate,
    },
    commentLike: { count: mocks.commentLikeCount },
    paperFollow: { count: mocks.paperFollowCount },
  },
}));

import { loadProfileMetrics } from "@/lib/auth/profile-metrics";

describe("loadProfileMetrics", () => {
  beforeEach(() => {
    mocks.paperCount.mockReset();
    mocks.commentLikeCount.mockReset();
    mocks.paperAggregate.mockReset();
    mocks.paperFollowCount.mockReset();
  });

  it("aggregates published papers, likes, views and follows", async () => {
    mocks.paperCount.mockResolvedValue(4);
    mocks.commentLikeCount.mockResolvedValue(7);
    mocks.paperAggregate.mockResolvedValue({ _sum: { viewCount: 100 } });
    mocks.paperFollowCount.mockResolvedValue(3);

    const metrics = await loadProfileMetrics("user-1");
    expect(metrics).toEqual({
      papersPublished: 4,
      totalLikes: 7,
      paperEngagement: 103,
    });
  });
});
