import { Dashboard } from "@/components/dashboard";
export default async function Home({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
 const { month } = await searchParams;
 return <Dashboard requestedMonth={month} />;
}
