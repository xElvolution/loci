import { redirect } from "next/navigation";

export default async function TeamPatientRedirect(props: PageProps<"/app/team/[id]">) {
  const { id } = await props.params;
  redirect(/^[0-9a-f-]{36}$/i.test(id) ? `/clinic/p/${id}` : "/clinic");
}
