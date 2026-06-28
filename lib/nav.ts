import {
  LayoutDashboard,
  Sparkles,
  Radar,
  BarChart3,
  Users,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  accent?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "LUNA", href: "/dashboard/luna", icon: Sparkles, accent: "#1A3BFF" },
  { label: "ORION", href: "/dashboard/orion", icon: Radar, accent: "#1D9E75" },
  { label: "HERMES", href: "/dashboard/hermes", icon: BarChart3, accent: "#BA7517" },
  { label: "Clients", href: "/dashboard/clients", icon: Users },
];

export const SETTINGS_ITEM: NavItem = {
  label: "Paramètres",
  href: "/dashboard/settings",
  icon: Settings,
};

/** Items shown in the mobile bottom navigation (max 5). */
export const MOBILE_NAV: NavItem[] = NAV_ITEMS;
