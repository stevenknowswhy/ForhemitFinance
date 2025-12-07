"use client";

/**
 * AppFooterWrapper - Conditionally renders GlobalFooter
 * Hides on marketing pages (/, /pricing, /features, etc.) where MarketingFooter is used
 */

import { usePathname } from "next/navigation";
import { GlobalFooter } from "./GlobalFooter";

// Marketing routes that have their own footer
const MARKETING_ROUTES = [
    "/",
    "/pricing",
    "/features",
    "/faq",
    "/blog",
    "/privacy",
    "/terms",
    "/about",
    "/contact",
];

export function AppFooterWrapper() {
    const pathname = usePathname();

    // Don't render GlobalFooter on marketing pages
    const isMarketingPage = MARKETING_ROUTES.includes(pathname);

    if (isMarketingPage) {
        return null;
    }

    return <GlobalFooter />;
}
