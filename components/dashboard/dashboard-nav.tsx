import Link from "next/link";
import {
  CalendarDays,
  Home,
  LogOut,
  MessageSquare,
  Settings,
  UserPlus,
  Users
} from "lucide-react";
import { signOut } from "@/app/(auth)/login/actions";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: Home },
  { href: "/dashboard/families", label: "Families", icon: Users },
  { href: "/dashboard/services", label: "Services", icon: CalendarDays },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/family-access", label: "Family Access", icon: UserPlus },
  { href: "/dashboard/settings", label: "Settings", icon: Settings }
];

export function DashboardNav() {
  return (
    <aside className="sidebar">
      <div className="brand-block">
        <span className="brand-mark">M</span>
        <div>
          <strong>Marshall</strong>
          <span>Family Care</span>
        </div>
      </div>
      <nav className="nav-list" aria-label="Dashboard navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link href={item.href} key={item.href} className="nav-link">
              <Icon size={18} aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <form action={signOut}>
        <button className="nav-link sign-out" type="submit">
          <LogOut size={18} aria-hidden="true" />
          Sign out
        </button>
      </form>
    </aside>
  );
}
