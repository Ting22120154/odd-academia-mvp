import { describe, expect, it } from "vitest";
import {
  mapDbContributors,
  mapContributorsForPostPage,
  parseContributorInputs,
} from "@/lib/papers/contributors";

describe("paper contributors helpers", () => {
  it("parseContributorInputs dedupes by userId or label", () => {
    const parsed = parseContributorInputs([
      { label: "Alice", userId: "u1" },
      { label: "Alice duplicate", userId: "u1" },
      { label: "Bob" },
      { label: "bob" },
    ]);
    expect(parsed).toEqual([
      { label: "Alice", userId: "u1" },
      { label: "Bob" },
    ]);
  });

  it("parseContributorInputs accepts prisma contributor rows", () => {
    expect(
      parseContributorInputs([{ contributorName: "Se-on", contributorUserId: "abc" }]),
    ).toEqual([{ label: "Se-on", userId: "abc" }]);
  });

  it("mapDbContributors links platform users", () => {
    const mapped = mapDbContributors([
      {
        contributorName: "Se-on",
        contributorUserId: "user-1",
        user: {
          id: "user-1",
          fullName: "Se-on",
          username: "seon",
          avatarUrl: null,
        },
      },
      {
        contributorName: "External Person",
        contributorUserId: null,
        user: null,
      },
    ]);
    expect(mapped[0].userId).toBe("user-1");
    expect(mapped[0].avatarUrl).toBeUndefined();
    expect(mapped[1].userId).toBeUndefined();
  });

  it("mapContributorsForPostPage adds profile href for platform users", () => {
    expect(
      mapContributorsForPostPage([
        {
          contributorName: "Se-on",
          contributorUserId: "user-1",
          user: {
            id: "user-1",
            fullName: "Se-on",
            username: "seon",
            avatarUrl: null,
          },
        },
      ]),
    ).toEqual([
      { label: "Se-on", userId: "user-1", href: "/user/user-1" },
    ]);
  });
});
