"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

type WorkStatus = "Open For Work" | "Not Open For Work" | "Freelance" | "None";

const WORK_OPTIONS: WorkStatus[] = [
  "Open For Work",
  "Not Open For Work",
  "Freelance",
  "None",
];

function GitHubIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="text-gray-500"
    >
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="text-[#0A66C2]"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export default function DetailsPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [ready, setReady] = useState(false);

  // Form state
  const [fullName, setFullName] = useState("");
  const [education, setEducation] = useState("");
  const [github, setGithub] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [bio, setBio] = useState("");
  const [workStatus, setWorkStatus] = useState<WorkStatus>("None");
  const [errors, setErrors] = useState<{ fullName?: string; email?: string }>({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      const pending = localStorage.getItem("pendingUser");
      const interests = localStorage.getItem("userInterests");
      if (!pending || !interests) {
        router.push("/onboarding/interests");
        return;
      }
      // Pre-fill name and email from signup step
      try {
        const parsed = JSON.parse(pending) as {
          fullName: string;
          email: string;
        };
        setFullName(parsed.fullName ?? "");
        setContactEmail(parsed.email ?? "");
      } catch {
        // ignore
      }
      setReady(true);
    }
  }, [router]);

  function handleSave() {
    const nextErrors: { fullName?: string; email?: string } = {};
    if (!fullName.trim()) nextErrors.fullName = "Full name is required.";
    if (!contactEmail.trim()) nextErrors.email = "Contact email is required.";
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});

    if (typeof window !== "undefined") {
      localStorage.removeItem("pendingUser");
      localStorage.removeItem("userInterests");
    }

    login({
      id: "u_" + Date.now(),
      fullName: fullName.trim(),
      email: contactEmail.trim(),
      avatarUrl: undefined,
    });
  }

  const inputClass =
    "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const labelClass = "mb-1 block text-sm font-medium text-gray-700";

  if (!ready) return null;

  return (
    <div className="flex min-h-screen flex-col bg-white px-6 py-12">
      <div className="mx-auto w-full max-w-2xl">
        {/* Header */}
        <h1 className="mb-8 text-2xl font-semibold text-gray-900">
          Set up your profile
        </h1>

        {/* Avatar section */}
        <div className="mb-8 flex items-center gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-gray-300 bg-gray-50">
            <svg
              className="h-8 w-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Profile Image</p>
            <p className="mt-0.5 text-xs text-gray-400">
              Choose your primary profile image
            </p>
            <div className="mt-2 flex gap-3 text-xs text-[#2563EB]">
              <button type="button" className="hover:underline">
                Upload Image
              </button>
              <span className="text-gray-300">·</span>
              <button type="button" className="hover:underline">
                Primary Image
              </button>
              <span className="text-gray-300">·</span>
              <button type="button" className="hover:underline">
                Remove Image
              </button>
            </div>
          </div>
        </div>

        {/* Two-column form */}
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          {/* Left column */}
          <div>
            <label htmlFor="fullName" className={labelClass}>
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Smith"
              className={inputClass}
            />
            {errors.fullName && (
              <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>
            )}
          </div>

          <div>
            <label htmlFor="contactEmail" className={labelClass}>
              Contact Email <span className="text-red-500">*</span>
            </label>
            <input
              id="contactEmail"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputClass}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="education" className={labelClass}>
              Education
            </label>
            <input
              id="education"
              type="text"
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              placeholder="Bachelor's in Computer Science"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="jobTitle" className={labelClass}>
              Career / Job Title
            </label>
            <input
              id="jobTitle"
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Software Engineer"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="github" className={labelClass}>
              GitHub
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center">
                <GitHubIcon />
              </span>
              <input
                id="github"
                type="text"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                placeholder="github.com/username"
                className={inputClass + " pl-8"}
              />
            </div>
          </div>

          <div>
            <label htmlFor="linkedin" className={labelClass}>
              LinkedIn
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center">
                <LinkedInIcon />
              </span>
              <input
                id="linkedin"
                type="text"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="linkedin.com/in/username"
                className={inputClass + " pl-8"}
              />
            </div>
          </div>
        </div>

        {/* Public Bio */}
        <div className="mt-4">
          <label htmlFor="bio" className={labelClass}>
            Public Bio
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            placeholder="Tell the community a bit about yourself..."
            className={inputClass + " resize-none"}
          />
        </div>

        {/* Work availability */}
        <div className="mt-6">
          <p className="mb-3 text-sm font-medium text-gray-700">
            Are you on Odd Academia to improve your career?
          </p>
          <p className="mb-3 text-xs text-gray-400">
            Work Availability — simply select your preference
          </p>
          <div className="flex flex-wrap gap-2">
            {WORK_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setWorkStatus(option)}
                className={[
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  workStatus === option
                    ? "bg-[#2563EB] text-white"
                    : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
                ].join(" ")}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Save button */}
        <div className="mt-10 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            className="rounded-md bg-[#2563EB] px-8 py-2.5 text-sm font-medium text-white hover:opacity-95 transition-opacity"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
