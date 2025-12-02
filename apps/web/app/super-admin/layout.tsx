"use client";

import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { Loader2, LayoutDashboard, Building2, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isLoaded, user } = useUser();
    const pathname = usePathname();

    // We can't easily check isSuperAdmin here without a query
    // But the backend protects the data.
    // We can add a simple check if we want, but let's rely on the backend query in the page
    // or add a specific "am I super admin" query.

    // For now, just render the layout. The pages will handle auth checks.

    const navItems = [
        {
            name: "Dashboard",
            href: "/super-admin",
            icon: LayoutDashboard,
        },
        {
            name: "Organizations",
            href: "/super-admin", // Same as dashboard for now
            icon: Building2,
        },
        // Add more items as needed
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-slate-900 text-white p-4 shadow-md">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xl">
                        <span className="text-amber-500">⚡</span>
                        Super Admin
                    </div>
                    <div className="text-sm text-slate-400">
                        {user?.primaryEmailAddress?.emailAddress}
                    </div>
                </div>
            </header>

            <div className="flex-1 container mx-auto py-8 flex gap-8">
                <aside className="w-64 shrink-0">
                    <nav className="space-y-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                                    pathname === item.href
                                        ? "bg-slate-200 text-slate-900"
                                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                )}
                            >
                                <item.icon className="w-4 h-4" />
                                {item.name}
                            </Link>
                        ))}
                    </nav>
                </aside>

                <main className="flex-1">
                    {children}
                </main>
            </div>
        </div>
    );
}
