/**
 * Marketing Site Configuration
 * Central source of truth for all navigation links and marketing content
 */

export interface NavLink {
    label: string;
    href: string;
}

export interface SocialLink {
    label: string;
    href: string;
    icon: "twitter" | "github" | "linkedin";
}

// Header navigation items
export const headerNavItems = [
    { label: "Products", href: "#", hasDropdown: true },
    { label: "Solutions", href: "#", hasDropdown: true },
    { label: "Resources", href: "#", hasDropdown: true },
    { label: "Company", href: "#", hasDropdown: true },
    { label: "Pricing", href: "/pricing", hasDropdown: false },
] as const;

// Footer link columns
export const footerLinks = {
    product: {
        title: "Product",
        links: [
            { label: "Features", href: "/features" },
            { label: "Pricing", href: "/pricing" },
        ] as NavLink[],
    },
    resources: {
        title: "Resources",
        links: [
            { label: "FAQ", href: "/faq" },
            { label: "Blog", href: "/blog" },
        ] as NavLink[],
    },
    company: {
        title: "Company",
        links: [
            { label: "Privacy Policy", href: "/privacy" },
            { label: "Terms of Service", href: "/terms" },
        ] as NavLink[],
    },
} as const;

// Social links
export const socialLinks: SocialLink[] = [
    { label: "Twitter", href: "https://twitter.com", icon: "twitter" },
    { label: "GitHub", href: "https://github.com", icon: "github" },
    { label: "LinkedIn", href: "https://linkedin.com", icon: "linkedin" },
];

// Brand info
export const brandInfo = {
    name: "Forhemit",
    tagline: "Streamline your social media presence with automated scheduling and AI-powered content suggestions.",
    contactEmail: "hi@forhemit.com",
    copyrightYear: new Date().getFullYear(),
} as const;
