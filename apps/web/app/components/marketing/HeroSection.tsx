import { AuthCtaGroup } from "./AuthCtaGroup";
import { TrustBar } from "./TrustBar";
import { HeroImageCard } from "./HeroImageCard";

interface HeroSectionProps {
    headline?: string;
    subheadline?: string;
    imageSrc?: string;
    imageAlt?: string;
}

export function HeroSection({
    headline = "AI that thinks, does, and gets results for you.",
    subheadline = "Accelerate your productivity with AI that understands context, generates insights, and helps you accomplish more—safely and securely.",
    imageSrc = "/images/hero-person.png",
    imageAlt = "Creative professional sitting on sculptural wooden blocks",
}: HeroSectionProps) {
    return (
        <section className="bg-white">
            <div className="max-w-6xl mx-auto px-4 lg:px-6 py-16 lg:py-24">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    {/* Left Column - Text Content */}
                    <div className="order-1">
                        <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-semibold tracking-tight text-black leading-[1.1] mb-6">
                            {headline}
                        </h1>

                        <p className="text-base lg:text-lg text-neutral-600 leading-relaxed mb-8 max-w-lg">
                            {subheadline}
                        </p>

                        <AuthCtaGroup />

                        <TrustBar />
                    </div>

                    {/* Right Column - Image */}
                    <div className="order-2 lg:order-2">
                        <HeroImageCard imageSrc={imageSrc} alt={imageAlt} />
                    </div>
                </div>
            </div>
        </section>
    );
}
