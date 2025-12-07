"use client";

import { useState } from "react";
import { useSignIn } from "@clerk/nextjs";

interface AuthCtaGroupProps {
    onEmailSubmit?: (email: string) => void;
}

export function AuthCtaGroup({ onEmailSubmit }: AuthCtaGroupProps) {
    const [email, setEmail] = useState("");
    const { signIn, isLoaded } = useSignIn();

    const handleGoogleSignIn = async () => {
        if (!isLoaded) return;
        try {
            await signIn.authenticateWithRedirect({
                strategy: "oauth_google",
                redirectUrl: "/sso-callback",
                redirectUrlComplete: "/dashboard",
            });
        } catch (error) {
            console.error("Google sign-in error:", error);
        }
    };

    const handleEmailSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email.trim()) {
            onEmailSubmit?.(email);
            // Default behavior: redirect to sign-up with email prefilled
            window.location.href = `/sign-up?email=${encodeURIComponent(email)}`;
        }
    };

    return (
        <div className="space-y-4 max-w-sm">
            {/* Google Sign In */}
            <button
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-neutral-300 rounded-lg text-sm font-medium text-neutral-800 hover:bg-neutral-50 hover:border-neutral-400 transition-all shadow-sm"
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                </svg>
                Sign in with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-neutral-200"></div>
                <span className="text-xs text-neutral-400 uppercase tracking-wide">or</span>
                <div className="flex-1 h-px bg-neutral-200"></div>
            </div>

            {/* Email Input */}
            <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-2">
                <label htmlFor="hero-email" className="sr-only">
                    Email address
                </label>
                <input
                    id="hero-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-2.5 text-sm border border-neutral-300 rounded-lg placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-neutral-400 transition-all"
                    required
                />
                <button
                    type="submit"
                    className="px-4 py-2.5 text-sm font-medium text-white bg-black rounded-lg hover:bg-neutral-900 transition-colors whitespace-nowrap"
                >
                    Continue with email
                </button>
            </form>
        </div>
    );
}
