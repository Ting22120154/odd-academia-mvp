import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/** Send logged-in users to home, everyone else to login. */
export default async function RootPage() {
  const session = (await cookies()).get("auth-session")?.value;
  if (session === "user") {
    redirect("/home");
  }
  redirect("/login");
}
