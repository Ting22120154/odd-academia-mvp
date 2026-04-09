import { redirect } from "next/navigation";

/**
 * Route alias for the required flow:
 * onboarding → login → home → view paper → profile → notifications
 *
 * We keep `/` as the real home for simplicity, but expose `/home` as a stable route.
 */
export default function HomeRoute() {
  redirect("/");
}

