/**
 * Landing Page - EZ Financial
 * Targeting: Startups & Solopreneurs across America
 */

import { Header } from "./components/Header";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
              The Financial Cockpit for
              <br />
              <span className="text-primary">Early-Stage Startups</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Simple bookkeeping that doesn't slow you down. Powerful runway visibility 
              that helps you make decisions fast. Built for startups and new businesses, not accountants.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/signup"
                className="px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold text-lg hover:bg-primary/90 transition-colors"
              >
                Start Free Trial
              </a>
              <a
                href="#demo"
                className="px-8 py-4 bg-background text-primary rounded-lg font-semibold text-lg border-2 border-primary hover:bg-muted transition-colors"
              >
                See Demo
              </a>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              No credit card required • 30-day free trial • Set up in 15 minutes
            </p>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              You're Building Fast. Your Books Shouldn't Hold You Back.
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
                too accountant-focused. You're not there yet.
              </p>
            </div>

            <div className="p-6 border border-border rounded-lg bg-card">
              <div className="text-yellow-500 dark:text-yellow-400 text-4xl mb-4">⚠️</div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Spreadsheets</h3>
              <p className="text-muted-foreground">
                Works until it doesn't. Hard to maintain, easy to mess up, impossible 
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
              Everything You Need to Run Your Startup's Finances
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
                    "Can I afford to hire?" calculator
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
                  Start simple. When you're ready for QuickBooks or Xero, export everything 
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
                "Finally, bookkeeping that doesn't feel like punishment. I can actually 
                understand my numbers now."
              </p>
              <p className="font-semibold text-foreground">— Sarah Chen, Founder</p>
              <p className="text-sm text-muted-foreground">Seed-stage SaaS startup</p>
            </div>

            <div className="p-6 bg-card rounded-lg border border-border">
              <p className="text-muted-foreground mb-4 italic">
                "The burn rate visibility alone is worth it. I can make hiring decisions 
                with confidence now."
              </p>
              <p className="font-semibold text-foreground">— Marcus Rodriguez, Co-founder</p>
              <p className="text-sm text-muted-foreground">Series A fintech startup</p>
            </div>

            <div className="p-6 bg-card rounded-lg border border-border">
              <p className="text-muted-foreground mb-4 italic">
                "Investor-ready reports in one click. This is exactly what we needed 
                before we had a CFO."
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

      {/* Footer */}
      <footer className="bg-muted/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4 text-foreground">EZ Financial</h3>
              <p className="text-muted-foreground text-sm">
                The financial cockpit for early-stage founders.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/features" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="/pricing" className="hover:text-primary transition-colors">Pricing</a></li>
                <li><a href="/integrations" className="hover:text-primary transition-colors">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/blog" className="hover:text-primary transition-colors">Blog</a></li>
                <li><a href="/docs" className="hover:text-primary transition-colors">Documentation</a></li>
                <li><a href="/support" className="hover:text-primary transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/about" className="hover:text-primary transition-colors">About</a></li>
                <li><a href="/contact" className="hover:text-primary transition-colors">Contact</a></li>
                <li><a href="/privacy" className="hover:text-primary transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            © 2024 EZ Financial. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

