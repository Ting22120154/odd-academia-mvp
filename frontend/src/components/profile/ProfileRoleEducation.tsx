"use client";

type Props = {
  jobTitle?: string;
  education?: string;
};

export function ProfileRoleEducation({ jobTitle, education }: Props) {
  if (!jobTitle && !education) return null;

  return (
    <div className="mt-3 space-y-1 text-sm text-zinc-600">
      {jobTitle && (
        <p>
          <span className="font-medium text-zinc-700">Job title:</span> {jobTitle}
        </p>
      )}
      {education && (
        <p>
          <span className="font-medium text-zinc-700">Education:</span> {education}
        </p>
      )}
    </div>
  );
}
