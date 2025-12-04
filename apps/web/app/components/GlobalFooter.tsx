"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Shield, Settings, Home } from "lucide-react";

/**
 * Global footer with role-based navigation
 * - Shows "Super Admin Panel", "Admin Dashboard", and "User View" links
 * - "Super Admin Panel" is only visible to super admins
 */
export function GlobalFooter() {
    const { user } = useUser();

    // Check if user is super admin
    const isSuperAdmin = user?.publicMetadata?.isSuperAdmin === true;

    return (
        <footer className="border-t bg-background">
            <div className="max-w-7xl mx-auto px-4 py-4">
                <nav className="flex items-center justify-center gap-6 text-sm">
                    {isSuperAdmin && (
                        <Link
                            href="/super-admin"
                            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <Shield className="w-4 h-4" />
                            <span>Super Admin Panel</span>
                        </Link>
                    )}
                    <Link
                        href="/settings"
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <Settings className="w-4 h-4" />
                        <span>Admin Dashboard</span>
                    </Link>
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <Home className="w-4 h-4" />
                        <span>User View</span>
                    </Link>
                </nav>
            </div>
        </footer>
    );
}
