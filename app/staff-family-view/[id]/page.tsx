import { redirect } from "next/navigation";

type StaffFamilyViewPageProps = {
  params: Promise<{ id: string }>;
};

export default async function StaffFamilyViewPage({ params }: StaffFamilyViewPageProps) {
  const { id } = await params;
  redirect(`/dashboard/families/${id}`);
}
