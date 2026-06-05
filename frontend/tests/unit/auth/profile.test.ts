import { describe, expect, it } from "vitest";
import {
  visibilityFromUi,
  visibilityToUi,
  workStatusFromUi,
  workStatusToUi,
} from "@/lib/auth/profile";

describe("profile mappers", () => {
  it("maps work status UI labels to DB enum", () => {
    expect(workStatusFromUi("Open for Work")).toBe("open");
    expect(workStatusFromUi("Not Looking")).toBe("not_open");
    expect(workStatusFromUi("Freelancing")).toBe("freelance");
    expect(workStatusFromUi("Unknown")).toBe("none");
  });

  it("maps DB enum to UI labels", () => {
    expect(workStatusToUi("open")).toBe("Open for Work");
    expect(workStatusToUi("not_open")).toBe("Not Looking");
  });

  it("maps profile visibility", () => {
    expect(visibilityToUi(true)).toBe("PUBLIC");
    expect(visibilityToUi(false)).toBe("PRIVATE");
    expect(visibilityFromUi("PUBLIC")).toBe(true);
    expect(visibilityFromUi("PRIVATE")).toBe(false);
  });
});
