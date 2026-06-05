import { redirect } from "next/navigation";

/** Saved papers feature removed — use Follow Paper on the paper page. */
export default function SavedPapersPage() {
  redirect("/home");
}
