import { redirect } from "next/navigation";

// Login-first SaaS: the root sends visitors straight to sign-in.
export default function RootPage() {
  redirect("/login");
}
