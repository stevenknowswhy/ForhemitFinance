import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const TESTIMONIALS = [
    {
        name: "An Yujin",
        role: "CEO",
        company: "Acme.",
        image: "/avatars/01.png",
        fallback: "AY",
    },
    {
        name: "Dorian Baffier",
        role: "Developer",
        company: "Acme.",
        image: "/avatars/02.png",
        fallback: "DB",
    },
    {
        name: "Kim Yerin",
        role: "Developer",
        company: "Acme.",
        image: "/avatars/03.png",
        fallback: "KY",
    },
    {
        name: "Benjamin",
        role: "CTO",
        company: "Acme.",
        image: "/avatars/04.png",
        fallback: "B",
    },
];

export function SocialProof() {
    return (
        <section className="py-24 bg-muted/30">
            <div className="max-w-7xl mx-auto px-4">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">
                            Trusted by <span className="text-muted-foreground">industry leaders.</span>
                        </h2>
                        <p className="text-xl text-muted-foreground mb-8 max-w-lg">
                            Don&apos;t just take our word for it. Here&apos;s what our clients have to say about their experiences working with us. Real stories from real partners who&apos;ve achieved real results.
                        </p>

                        <div className="flex items-center gap-4 mb-8">
                            {/* Placeholder logos */}
                            <div className="flex -space-x-2">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="w-8 h-8 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center text-xs">
                                        Logo
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                            View Case Studies
                        </button>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                        {TESTIMONIALS.map((testimonial, index) => (
                            <Card key={index} className="bg-card/50 border-0 shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="p-6 flex flex-col items-center text-center">
                                    <div className="w-20 h-20 rounded-full bg-muted mb-4 overflow-hidden">
                                        {/* In a real app, use next/image */}
                                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-2xl font-bold text-primary">
                                            {testimonial.fallback}
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-lg">{testimonial.name}</h3>
                                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                                    <p className="text-sm text-muted-foreground font-medium mt-1">{testimonial.company}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
