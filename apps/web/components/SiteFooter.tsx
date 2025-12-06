import Link from "next/link";
import { Twitter, Github, Linkedin } from "lucide-react";

export function SiteFooter() {
    return (
        <footer className="bg-background border-t">
            <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                    <div className="col-span-2 md:col-span-1">
                        <Link href="/" className="text-2xl font-bold text-primary mb-4 block">
                            EZ Financial
                        </Link>
                        <p className="text-muted-foreground text-sm">
                            Empowering startups with financial clarity and control.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-4">Product</h3>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li><Link href="/pricing" className="hover:text-foreground">Pricing</Link></li>
                            <li><Link href="/features" className="hover:text-foreground">Features</Link></li>
                            <li><Link href="/changelog" className="hover:text-foreground">Changelog</Link></li>
                            <li><Link href="/docs" className="hover:text-foreground">Documentation</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-4">Company</h3>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li><Link href="/about" className="hover:text-foreground">About</Link></li>
                            <li><Link href="/blog" className="hover:text-foreground">Blog</Link></li>
                            <li><Link href="/careers" className="hover:text-foreground">Careers</Link></li>
                            <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-4">Legal</h3>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li><Link href="/privacy" className="hover:text-foreground">Privacy</Link></li>
                            <li><Link href="/terms" className="hover:text-foreground">Terms</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-muted-foreground">
                        © {new Date().getFullYear()} EZ Financial. All rights reserved.
                    </p>

                    <div className="flex items-center gap-4">
                        <Link href="https://twitter.com" className="text-muted-foreground hover:text-foreground transition-colors">
                            <Twitter className="h-5 w-5" />
                            <span className="sr-only">Twitter</span>
                        </Link>
                        <Link href="https://github.com" className="text-muted-foreground hover:text-foreground transition-colors">
                            <Github className="h-5 w-5" />
                            <span className="sr-only">GitHub</span>
                        </Link>
                        <Link href="https://linkedin.com" className="text-muted-foreground hover:text-foreground transition-colors">
                            <Linkedin className="h-5 w-5" />
                            <span className="sr-only">LinkedIn</span>
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
