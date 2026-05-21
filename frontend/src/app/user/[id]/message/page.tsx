"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/** Old contact-form page — replaced by the ChatModal on the profile page. */
export default function MessageRedirect() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/user/${id}`);
  }, [id, router]);

  return null;
}
