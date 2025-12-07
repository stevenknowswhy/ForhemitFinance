"use client";

/**
 * MarketingFooter - Standalone marketing footer component
 * Based on the Acme template design
 */

import Link from "next/link";
import { footerLinks, brandInfo } from "@/lib/marketing-config";

export function MarketingFooter() {
    return (
        <footer className="bg-neutral-50 border-t border-neutral-200">
            <div className="max-w-6xl mx-auto px-4 lg:px-8 py-12 lg:py-16">
                {/* Main Footer Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
                    {/* Brand Column */}
                    <div className="lg:col-span-1">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <span className="text-xl">✱</span>
                            <span className="text-lg font-semibold tracking-tight text-black">
                                {brandInfo.name}
                            </span>
                            <span className="px-2 py-0.5 text-[10px] font-medium bg-neutral-200 text-neutral-600 rounded">
                                BETA
                            </span>
                        </Link>
                        <p className="text-sm text-neutral-600 leading-relaxed max-w-xs">
                            {brandInfo.tagline}
                        </p>
                    </div>

                    {/* Product Links */}
                    <div>
                        <h3 className="text-sm font-semibold text-neutral-900 mb-4">
                            {footerLinks.product.title}
                        </h3>
                        <ul className="space-y-3">
                            {footerLinks.product.links.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Resources Links */}
                    <div>
                        <h3 className="text-sm font-semibold text-neutral-900 mb-4">
                            {footerLinks.resources.title}
                        </h3>
                        <ul className="space-y-3">
                            {footerLinks.resources.links.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company Links */}
                    <div>
                        <h3 className="text-sm font-semibold text-neutral-900 mb-4">
                            {footerLinks.company.title}
                        </h3>
                        <ul className="space-y-3">
                            {footerLinks.company.links.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-center pt-8 border-t border-neutral-200 gap-4">
                    <p className="text-sm text-neutral-500">
                        © {brandInfo.copyrightYear} {brandInfo.name}. All rights reserved.
                    </p>
                    <p className="text-sm text-neutral-500">
                        Any questions? Contact{" "}
                        <a
                            href={`mailto:${brandInfo.contactEmail}`}
                            className="text-neutral-700 hover:text-neutral-900 transition-colors"
                        >
                            {brandInfo.contactEmail}
                        </a>
                    </p>
                </div>
            </div>
        </footer>
    );
}
