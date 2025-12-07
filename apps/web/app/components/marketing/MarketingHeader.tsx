"use client";

import { useState } from "react";
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";

interface NavItem {
    label: string;
    href: string;
    hasDropdown?: boolean;
}

const navItems: NavItem[] = [
    { label: "Products", href: "#", hasDropdown: true },
    { label: "Solutions", href: "#", hasDropdown: true },
    { label: "Resources", href: "#", hasDropdown: true },
    { label: "Company", href: "#", hasDropdown: true },
    { label: "Pricing", href: "/pricing", hasDropdown: false },
];

interface MarketingHeaderProps {
    onContactClick?: () => void;
    onTryClick?: () => void;
}

export function MarketingHeader({ onContactClick, onTryClick }: MarketingHeaderProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <header className="w-full bg-white/80 backdrop-blur-sm border-b border-neutral-100">
            <div className="max-w-6xl mx-auto px-4 lg:px-6">
                <div className="flex items-center justify-between h-16 lg:h-18">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <span className="text-xl font-light">✱</span>
                        <span className="text-lg font-semibold tracking-tight text-black">Forhemit</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-8">
                        {navItems.map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                className="flex items-center gap-1 text-sm text-neutral-700 hover:text-black transition-colors"
                            >
                                {item.label}
                                {item.hasDropdown && (
                                    <svg
                                        className="w-3 h-3 text-neutral-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                )}
                            </Link>
                        ))}
                    </nav>

                    {/* Desktop CTAs */}
                    <div className="hidden md:flex items-center gap-3">
                        <SignedOut>
                            <button
                                onClick={onContactClick}
                                className="px-4 py-2 text-sm text-neutral-700 hover:text-black border border-neutral-300 rounded-full hover:bg-neutral-50 transition-all"
                            >
                                Contact Sales
                            </button>
                            <SignUpButton mode="modal">
                                <button
                                    onClick={onTryClick}
                                    className="px-4 py-2 text-sm font-medium text-white bg-black rounded-full hover:bg-neutral-900 transition-colors"
                                >
                                    Try Forhemit
                                </button>
                            </SignUpButton>
                        </SignedOut>

                        <SignedIn>
                            <Link
                                href="/dashboard"
                                className="px-4 py-2 text-sm font-medium text-white bg-black rounded-full hover:bg-neutral-900 transition-colors"
                            >
                                Dashboard
                            </Link>
                            <UserButton
                                appearance={{
                                    elements: {
                                        avatarBox: "w-9 h-9",
                                    },
                                }}
                            />
                        </SignedIn>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        type="button"
                        className="md:hidden p-2 text-neutral-700 hover:text-black"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {mobileMenuOpen ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        )}
                    </button>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-neutral-100 py-4">
                        <nav className="flex flex-col gap-2 mb-4">
                            {navItems.map((item) => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className="flex items-center justify-between px-2 py-2 text-sm text-neutral-700 hover:text-black hover:bg-neutral-50 rounded-lg transition-colors"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {item.label}
                                    {item.hasDropdown && (
                                        <svg
                                            className="w-4 h-4 text-neutral-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    )}
                                </Link>
                            ))}
                        </nav>

                        <div className="flex flex-col gap-2 pt-4 border-t border-neutral-100">
                            <SignedOut>
                                <button
                                    onClick={() => {
                                        onContactClick?.();
                                        setMobileMenuOpen(false);
                                    }}
                                    className="w-full px-4 py-2.5 text-sm text-neutral-700 border border-neutral-300 rounded-full hover:bg-neutral-50 transition-all"
                                >
                                    Contact Sales
                                </button>
                                <SignUpButton mode="modal">
                                    <button
                                        className="w-full px-4 py-2.5 text-sm font-medium text-white bg-black rounded-full hover:bg-neutral-900 transition-colors"
                                    >
                                        Try Forhemit
                                    </button>
                                </SignUpButton>
                            </SignedOut>

                            <SignedIn>
                                <Link
                                    href="/dashboard"
                                    className="w-full text-center px-4 py-2.5 text-sm font-medium text-white bg-black rounded-full hover:bg-neutral-900 transition-colors"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Go to Dashboard
                                </Link>
                            </SignedIn>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
