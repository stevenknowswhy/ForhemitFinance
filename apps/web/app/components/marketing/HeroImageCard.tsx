import Image from "next/image";

interface HeroImageCardProps {
    imageSrc: string;
    alt: string;
}

export function HeroImageCard({ imageSrc, alt }: HeroImageCardProps) {
    return (
        <div className="relative">
            {/* Main image container */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-[#c85e31]">
                <Image
                    src={imageSrc}
                    alt={alt}
                    width={600}
                    height={700}
                    className="w-full h-auto object-cover"
                    priority
                />

                {/* Decorative floating elements */}
                {/* Top-right squiggle */}
                <div className="absolute top-8 right-8">
                    <svg
                        width="60"
                        height="40"
                        viewBox="0 0 60 40"
                        fill="none"
                        className="text-teal-400 opacity-80"
                    >
                        <path
                            d="M5 20 Q 15 5, 30 20 T 55 20"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            strokeLinecap="round"
                        />
                    </svg>
                </div>

                {/* Code-like glyphs scattered */}
                <div className="absolute top-16 right-4 text-teal-400 opacity-70 text-sm font-mono">
                    {"{ }"}
                </div>

                <div className="absolute top-32 right-12 text-teal-400 opacity-60 text-xs font-mono rotate-12">
                    {"</>"}
                </div>

                <div className="absolute bottom-24 right-6">
                    <svg
                        width="30"
                        height="30"
                        viewBox="0 0 30 30"
                        fill="none"
                        className="text-teal-400 opacity-70"
                    >
                        <circle cx="15" cy="15" r="6" stroke="currentColor" strokeWidth="2" fill="none" />
                        <circle cx="15" cy="15" r="12" stroke="currentColor" strokeWidth="1.5" fill="none" strokeDasharray="4 4" />
                    </svg>
                </div>

                {/* Small decorative dots */}
                <div className="absolute top-24 left-6 flex flex-col gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-teal-400 opacity-60"></div>
                    <div className="w-2 h-2 rounded-full bg-teal-400 opacity-40"></div>
                    <div className="w-2 h-2 rounded-full bg-teal-400 opacity-20"></div>
                </div>

                {/* Curved line at bottom */}
                <div className="absolute bottom-12 left-8">
                    <svg
                        width="80"
                        height="50"
                        viewBox="0 0 80 50"
                        fill="none"
                        className="text-teal-400 opacity-70"
                    >
                        <path
                            d="M5 45 Q 20 10, 40 25 T 75 10"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            fill="none"
                            strokeLinecap="round"
                        />
                    </svg>
                </div>
            </div>

            {/* Soft glow behind card */}
            <div className="absolute -inset-4 bg-gradient-to-br from-orange-200/30 to-amber-200/30 rounded-[2rem] -z-10 blur-2xl"></div>
        </div>
    );
}
