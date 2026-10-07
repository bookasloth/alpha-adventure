import { redirect } from "next/navigation";

// The account area is now the user dashboard.
export default function AccountPage() {
  redirect("/user-dashboard");
}
