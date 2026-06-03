import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/** Logged-in and guest sessions go to home; anonymous users go to login. */
export default async function RootPage() {
  const session = (await cookies()).get("auth-session")?.value;
  if (session === "user" || session === "guest") {
    redirect("/home");
  }
  redirect("/login");
}
