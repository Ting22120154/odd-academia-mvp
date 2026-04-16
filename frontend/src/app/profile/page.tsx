import Link from "next/link";
import { ProfileForm } from "@/components/ProfileForm";
import { mockUser } from "@/data/mockUser";

export default function ProfilePage() {
  return (
    <section className="mx-auto w-full max-w-6xl">
      <div className="text-sm text-zinc-600">My profile</div>

      <div className="mt-6">
        <Link href="/" className="text-sm font-medium text-zinc-700">
          ← Back
        </Link>
      </div>

      <div className="mt-3 text-lg font-semibold text-zinc-900">Profile</div>

      <div className="mt-6">
        <ProfileForm user={mockUser} />
      </div>
    </section>
  );
}
