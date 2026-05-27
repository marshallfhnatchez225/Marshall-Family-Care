import { redirect } from "next/navigation";

type FamilyViewPageProps = {
  params: Promise<{ id: string }>;
};

export default async function FamilyViewPage({ params }: FamilyViewPageProps) {
  const { id } = await params;
  redirect(`/dashboard/families/${id}`);
}
