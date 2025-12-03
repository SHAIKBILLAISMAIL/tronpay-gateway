
"use client";

import { usePathname } from "next/navigation";
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  ArrowRightLeft,
  Wallet,
  ShieldAlert,
  Settings,
  CircleHelp,
  Home,
  Users,
  Landmark,
  LogIn,
  UserPlus,
  CreditCard,
  Globe,
  ArrowDownLeft as ReceiveIcon,
  ArrowDownToLine,
} from "lucide-react";
import Link from "next/link";
import { useUser } from "@/firebase";

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowRightLeft },
  { href: "/wallets", label: "Wallets", icon: Wallet },
  { href: "/bank-accounts", label: "Bank Accounts", icon: Landmark },
  { href: "/withdraw-to-bank", label: "Withdraw to Bank", icon: ArrowDownToLine },
  { href: "/receive-info", label: "Receive Funds", icon: ReceiveIcon },
  { href: "/p2p-transfer", label: "P2P Transfer", icon: Users },
  { href: "/card-payment", label: "Card Payment", icon: CreditCard },
  { href: "/ip-transfer", label: "Advanced IP Transfer", icon: Globe },
  { href: "/risk-assessment", label: "Risk Assessment", icon: ShieldAlert },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function MainNav() {
  const pathname = usePathname();
  const { user } = useUser();

  return (
    <>
      <SidebarHeader>
        <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <svg
              className="h-5 w-5 text-primary-foreground"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2L2 7V17L12 22L22 17V7L12 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M16.5 9.4L7.5 14.7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 7L12 12L22 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="text-lg font-semibold">TronPay</span>
        </Link>
      </SidebarHeader>
      <SidebarMenu className="flex-1">
        {user && menuItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href} passHref>
              <SidebarMenuButton
                isActive={pathname === item.href}
                tooltip={item.label}
              >
                <item.icon />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        ))}
        {!user && (
          <>
            <SidebarMenuItem>
              <Link href="/" passHref>
                <SidebarMenuButton isActive={pathname === "/"} tooltip="Home">
                  <Home />
                  <span>Home</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/" passHref>
                <SidebarMenuButton tooltip="Log In" isActive={pathname === '/'}>
                  <LogIn />
                  <span>Log In</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/signup" passHref>
                <SidebarMenuButton tooltip="Sign Up" isActive={pathname === '/signup'}>
                  <UserPlus />
                  <span>Sign Up</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </>
        )}
      </SidebarMenu>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Help">
              <CircleHelp />
              <span>Help</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}


