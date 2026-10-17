import { LayoutDashboard, Users, Receipt, HandCoins, History, Settings, CalendarRange } from "lucide-react";
import type { NavItem } from "@/components/AppShell";

export const ADMIN_NAV: NavItem[] = [
  { to: "/admin", ta: "முகப்பு", en: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/members", ta: "உறுப்பினர்கள்", en: "Members", icon: Users },
  { to: "/admin/subscriptions", ta: "சந்தா", en: "Subscriptions", icon: Receipt },
  { to: "/admin/money", ta: "பணம் பெற்ற / திரும்பிய விவரம்", en: "Money Taken & Returned", icon: HandCoins },
  { to: "/admin/yearly-totals", ta: "ஆண்டு மொத்த தொகை", en: "Yearly Total Amount", icon: CalendarRange },
  { to: "/admin/audit", ta: "செயல் பதிவு", en: "Audit Log", icon: History },
  { to: "/admin/settings", ta: "அமைப்புகள்", en: "Settings", icon: Settings },
];

export const selectCls =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";
