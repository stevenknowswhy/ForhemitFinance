/**
 * Landing Page - Forhemit / EZ Financial
 * Lume-style hero section with minimal navigation
 * Header and Footer are now handled by the (marketing) layout
 */

import { HeroSection } from "../components/marketing";
import Link from "next/link";

export default function LandingPage() {
    return (
        <>
            <HeroSection
                headline="AI that thinks, does, and gets results for you."
                subheadline="Accelerate your productivity with AI that understands context, generates insights, and helps you accomplish more—safely and securely."
                imageSrc="/images/hero-person.png"
                imageAlt="Creative professional demonstrating productivity with Forhemit"
            />

            {/* Problem Section */}
            <section className="py-24 bg-background">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-foreground mb-4">
                            You&apos;re Building Fast. Your Books Shouldn&apos;t Hold You Back.
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                            Most startups are stuck between spreadsheets (too basic) and QuickBooks
                            (too complicated). You need something in between.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="p-6 border border-border rounded-lg bg-card">
                            <div className="text-red-500 dark:text-red-400 text-4xl mb-4">❌</div>
                            <h3 className="text-xl font-semibold mb-2 text-foreground">QuickBooks</h3>
                            <p className="text-muted-foreground">
                                Feels like enterprise software from 1998. Too complex, too much setup,
                                too accountant-focused. You&apos;re not there yet.
                            </p>
                        </div>

                        <div className="p-6 border border-border rounded-lg bg-card">
                            <div className="text-yellow-500 dark:text-yellow-400 text-4xl mb-4">⚠️</div>
                            <h3 className="text-xl font-semibold mb-2 text-foreground">Spreadsheets</h3>
                            <p className="text-muted-foreground">
                                Works until it doesn&apos;t. Hard to maintain, easy to mess up, impossible
                                to scale. Not investor-ready.
                            </p>
                        </div>

                        <div className="p-6 border-2 border-primary rounded-lg bg-primary/10 dark:bg-primary/20">
                            <div className="text-primary text-4xl mb-4">✅</div>
                            <h3 className="text-xl font-semibold mb-2 text-foreground">EZ Financial</h3>
                            <p className="text-muted-foreground">
                                Simple enough to start today. Powerful enough to grow with you.
                                Real enough for investors.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 bg-muted/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-foreground mb-4">
                            Everything You Need to Run Your Startup&apos;s Finances
                        </h2>
                        <p className="text-xl text-muted-foreground">
                            Built specifically for founders who need clarity, not complexity
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12">
                        {/* Feature 1 */}
                        <div className="flex gap-6">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center">
                                    <span className="text-2xl">📊</span>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-2xl font-semibold mb-3 text-foreground">Instant Burn Rate & Runway</h3>
                                <p className="text-muted-foreground mb-4">
                                    Connect your bank account and immediately see your monthly burn rate,
                                    cash runway, and where your money is going. No setup required.
                                </p>
                                <ul className="space-y-2 text-muted-foreground">
                                    <li className="flex items-start">
                                        <span className="text-green-500 dark:text-green-400 mr-2">✓</span>
                                        Monthly burn rate calculation
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-green-500 mr-2">✓</span>
                                        Cash runway projection (months remaining)
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-green-500 mr-2">✓</span>
                                        Top spend categories breakdown
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Feature 2 */}
                        <div className="flex gap-6">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center">
                                    <span className="text-2xl">🤖</span>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-2xl font-semibold mb-3 text-foreground">AI-Powered Financial Narrative</h3>
                                <p className="text-muted-foreground mb-4">
                                    Every month, get a plain-English summary of what happened financially,
                                    why expenses changed, and what you should focus on next.
                                </p>
                                <ul className="space-y-2 text-muted-foreground">
                                    <li className="flex items-start">
                                        <span className="text-green-500 dark:text-green-400 mr-2">✓</span>
                                        Monthly financial story
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-green-500 mr-2">✓</span>
                                        Spending pattern analysis
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-green-500 mr-2">✓</span>
                                        Actionable recommendations
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Feature 3 */}
                        <div className="flex gap-6">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center">
                                    <span className="text-2xl">📈</span>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-2xl font-semibold mb-3 text-foreground">Investor-Ready Reports</h3>
                                <p className="text-muted-foreground mb-4">
                                    Generate professional financial reports you can confidently share with
                                    investors, banks, or advisors. One-click export to PDF or Excel.
                                </p>
                                <ul className="space-y-2 text-muted-foreground">
                                    <li className="flex items-start">
                                        <span className="text-green-500 dark:text-green-400 mr-2">✓</span>
                                        P&L statements
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-green-500 mr-2">✓</span>
                                        Cash flow charts
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-green-500 mr-2">✓</span>
                                        Burn rate & runway visualization
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Feature 4 */}
                        <div className="flex gap-6">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center">
                                    <span className="text-2xl">⚡</span>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-2xl font-semibold mb-3 text-foreground">Simple Approval Workflow</h3>
                                <p className="text-muted-foreground mb-4">
                                    Transactions automatically categorized. You just approve or edit.
                                    No accounting knowledge required. Works on mobile.
                                </p>
                                <ul className="space-y-2 text-muted-foreground">
                                    <li className="flex items-start">
                                        <span className="text-green-500 dark:text-green-400 mr-2">✓</span>
                                        Auto-categorization with AI
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-green-500 mr-2">✓</span>
                                        Swipe to approve (mobile-first)
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-green-500 mr-2">✓</span>
                                        Proper double-entry behind the scenes
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Feature 5 */}
                        <div className="flex gap-6">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center">
                                    <span className="text-2xl">🎯</span>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-2xl font-semibold mb-3 text-foreground">Goal-Based Budgeting</h3>
                                <p className="text-muted-foreground mb-4">
                                    Set financial goals (hiring, runway, spending) and track progress.
                                    Get forecasts that help you make decisions.
                                </p>
                                <ul className="space-y-2 text-muted-foreground">
                                    <li className="flex items-start">
                                        <span className="text-green-500 dark:text-green-400 mr-2">✓</span>
                                        &quot;Can I afford to hire?&quot; calculator
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-green-500 mr-2">✓</span>
                                        Runway goals and tracking
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-green-500 mr-2">✓</span>
                                        Scenario planning
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Feature 6 */}
                        <div className="flex gap-6">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center">
                                    <span className="text-2xl">🔄</span>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-2xl font-semibold mb-3 text-foreground">Grows With You</h3>
                                <p className="text-muted-foreground mb-4">
                                    Start simple. When you&apos;re ready for QuickBooks or Xero, export everything
                                    with one click. No data lock-in.
                                </p>
                                <ul className="space-y-2 text-muted-foreground">
                                    <li className="flex items-start">
                                        <span className="text-green-500 dark:text-green-400 mr-2">✓</span>
                                        One-click export to QuickBooks/Xero
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-green-500 mr-2">✓</span>
                                        Proper double-entry foundation
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-green-500 mr-2">✓</span>
                                        Accountant-friendly reports
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Social Proof Section */}
            <section className="py-24 bg-background">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-foreground mb-4">
                            Built for Startups and New Businesses
                        </h2>
                        <p className="text-xl text-muted-foreground">
                            Perfect for early-stage startups and solopreneurs who need clarity, not complexity
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="p-6 bg-card rounded-lg border border-border">
                            <p className="text-muted-foreground mb-4 italic">
                                &quot;Finally, bookkeeping that doesn&apos;t feel like punishment. I can actually
                                understand my numbers now.&quot;
                            </p>
                            <p className="font-semibold text-foreground">— Sarah Chen, Founder</p>
                            <p className="text-sm text-muted-foreground">Seed-stage SaaS startup</p>
                        </div>

                        <div className="p-6 bg-card rounded-lg border border-border">
                            <p className="text-muted-foreground mb-4 italic">
                                &quot;The burn rate visibility alone is worth it. I can make hiring decisions
                                with confidence now.&quot;
                            </p>
                            <p className="font-semibold text-foreground">— Marcus Rodriguez, Co-founder</p>
                            <p className="text-sm text-muted-foreground">Series A fintech startup</p>
                        </div>

                        <div className="p-6 bg-card rounded-lg border border-border">
                            <p className="text-muted-foreground mb-4 italic">
                                &quot;Investor-ready reports in one click. This is exactly what we needed
                                before we had a CFO.&quot;
                            </p>
                            <p className="font-semibold text-foreground">— Alex Kim, CEO</p>
                            <p className="text-sm text-muted-foreground">Pre-seed marketplace startup</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="py-24 bg-primary">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-primary-foreground mb-4">
                            Simple Pricing for Startups
                        </h2>
                        <p className="text-xl text-primary-foreground/80">
                            Start free. Upgrade as you grow.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Light Plan */}
                        <div className="bg-card rounded-lg p-8 border border-border">
                            <h3 className="text-2xl font-bold mb-2 text-foreground">Light</h3>
                            <div className="mb-6">
                                <span className="text-4xl font-bold text-foreground">$19.99</span>
                                <span className="text-muted-foreground">/mo</span>
                            </div>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-start">
                                    <span className="text-green-500 mr-2">✓</span>
                                    <span>Single user</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-green-500 mr-2">✓</span>
                                    <span>Burn rate & runway</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-green-500 mr-2">✓</span>
                                    <span>AI monthly narrative</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-green-500 mr-2">✓</span>
                                    <span>Investor export pack</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-green-500 mr-2">✓</span>
                                    <span>Mobile app access</span>
                                </li>
                            </ul>
                            <Link
                                href="/pricing"
                                className="block w-full text-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                            >
                                View Pricing
                            </Link>
                        </div>

                        {/* Pro - Most Popular */}
                        <div className="bg-card rounded-lg p-8 border-4 border-primary relative">
                            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                                Most Popular
                            </div>
                            <h3 className="text-2xl font-bold mb-2 text-foreground">Pro</h3>
                            <div className="mb-6">
                                <span className="text-4xl font-bold text-foreground">$29.99</span>
                                <span className="text-muted-foreground">/mo</span>
                            </div>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-start">
                                    <span className="text-green-500 mr-2">✓</span>
                                    <span>Everything in Light</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-green-500 mr-2">✓</span>
                                    <span>Up to 10 users</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-green-500 mr-2">✓</span>
                                    <span>Advanced forecasting</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-green-500 mr-2">✓</span>
                                    <span>Multi-goal tracking</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-green-500 mr-2">✓</span>
                                    <span>Priority support</span>
                                </li>
                            </ul>
                            <Link
                                href="/pricing"
                                className="block w-full text-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                            >
                                View Pricing
                            </Link>
                        </div>
                    </div>

                    <p className="text-center text-primary-foreground/80 mt-8">
                        All plans include 30-day free trial. No credit card required.
                    </p>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-foreground">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-4xl font-bold text-background mb-6">
                        Ready to Get Your Finances in Order?
                    </h2>
                    <p className="text-xl text-background/80 mb-8">
                        Join startups and new businesses across America who are building their financial foundation the right way.
                    </p>
                    <a
                        href="/signup"
                        className="inline-block px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold text-lg hover:bg-primary/90 transition-colors"
                    >
                        Start Your Free Trial →
                    </a>
                    <p className="text-background/60 mt-4 text-sm">
                        Set up in 15 minutes • See your burn rate instantly • No credit card required
                    </p>
                </div>
            </section>
        </>
    );
}
