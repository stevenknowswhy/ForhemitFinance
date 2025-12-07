/**
 * Marketing Layout
 * Wraps all marketing pages with shared header and footer
 */

import { MarketingHeader, MarketingFooter } from "../components/marketing";

export default function MarketingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-white flex flex-col">
            <MarketingHeader />
            <main className="flex-1">{children}</main>
            <MarketingFooter />
        </div>
    );
}
