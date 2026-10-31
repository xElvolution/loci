import { redirect } from "next/navigation";

/** The care team view moved to its own workspace. */
export default function TeamRedirect() {
  redirect("/clinic");
}
