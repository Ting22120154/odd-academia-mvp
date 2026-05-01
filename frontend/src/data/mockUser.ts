export type MockUser = {
  id: string;
  fullName: string;
  email: string;
  workStatus: "Open for Work" | "Not Looking" | "Freelancing" | "Student";
  profileVisibility: "Public" | "Private";
  interests: string[];
  education: string;
  username: string;
  jobRole: string;
  github: string;
  linkedin: string;
  bio: string;
  avatarUrl?: string;
};

export const mockUser: MockUser = {
  id: "u_1",
  fullName: "Rick Smith",
  email: "rick.s@example.com",
  workStatus: "Open for Work",
  profileVisibility: "Public",
  interests: ["AI", "Biohacking"],
  education: "Bachelor’s Degree in Software Engineering",
  username: "r_smith",
  jobRole: "AI Engineer",
  github: "/rick_s",
  linkedin: "@rick_u_cl",
  bio: "Rick Smith is a visionary in the field of artificial intelligence, with a deep interest in developing innovative AI solutions to address real-world challenges.",
  avatarUrl: "/avatars/profile.svg",
};
