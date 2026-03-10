"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  ScanBarcode,
  FlaskConical,
  Layers,
  Leaf,
  TestTubes,
  MapPin,
  Thermometer,
  Package,
  TrendingUp,
  BarChart3,
  FileText,
  ClipboardList,
  BookOpen,
  Tag,
  Settings,
  LogOut,
  ChevronDown,
  Upload,
  Users,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { USER_ROLE_LABELS } from "@/lib/constants";
import { NotificationBell } from "@/components/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import { PinSwitch } from "@/components/pin-switch";

const navGroups = [
  {
    label: "Overview",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/scan", label: "Scan", icon: ScanBarcode },
    ],
  },
  {
    label: "Culture Management",
    items: [
      { href: "/vessels", label: "Vessels", icon: FlaskConical },
      { href: "/batch", label: "Batch Ops", icon: Layers },
      { href: "/import", label: "CSV Import", icon: Upload },
      { href: "/cultivars", label: "Cultivars", icon: Leaf },
      { href: "/media", label: "Media", icon: TestTubes },
    ],
  },
  {
    label: "Facility",
    items: [
      { href: "/locations", label: "Locations", icon: MapPin },
      { href: "/environment", label: "Environment", icon: Thermometer },
      { href: "/inventory", label: "Inventory", icon: Package },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/forecasting", label: "Forecasting", icon: TrendingUp },
      { href: "/reports", label: "Reports", icon: FileText },
      { href: "/activity", label: "Audit Log", icon: ClipboardList },
      { href: "/protocols", label: "SOPs", icon: BookOpen },
    ],
  },
  {
    label: "Admin",
    items: [
      { href: "/labels", label: "Labels", icon: Tag },
      { href: "/admin", label: "Settings", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [pinSwitchOpen, setPinSwitchOpen] = useState(false);

  const user = session?.user;
  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <Image src="/logo.png" alt="VitrOS" width={32} height={32} className="size-8 rounded-lg" />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-bold text-base">VitrOS</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {(user as Record<string, unknown> | undefined)?.organizationName as string || "Tissue Culture"}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <div className="px-3 pb-2 flex justify-end gap-1 group-data-[collapsible=icon]:hidden">
        <ThemeToggle />
        <NotificationBell />
      </div>

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                        <Link href={item.href}>
                          <item.icon className="size-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user?.name || "Not signed in"}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.role ? USER_ROLE_LABELS[user.role] || user.role : ""}
                    </span>
                  </div>
                  <ChevronDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
                side="top"
                align="start"
                sideOffset={4}
              >
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin">
                    <Settings className="mr-2 size-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setPinSwitchOpen(true)}>
                  <Users className="mr-2 size-4" />
                  Quick Switch (PIN)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
                  <LogOut className="mr-2 size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <PinSwitch open={pinSwitchOpen} onOpenChange={setPinSwitchOpen} />
    </Sidebar>
  );
}
