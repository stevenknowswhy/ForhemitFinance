export function TrustBar() {
    // Sample avatar initials for the trust indicator
    const avatars = [
        { initials: "SA", color: "bg-blue-500" },
        { initials: "MR", color: "bg-green-500" },
        { initials: "JK", color: "bg-purple-500" },
    ];

    return (
        <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500 mt-6">
            {/* Avatar cluster */}
            <div className="flex items-center">
                <div className="flex -space-x-2">
                    {avatars.map((avatar, i) => (
                        <div
                            key={i}
                            className={`w-7 h-7 rounded-full ${avatar.color} flex items-center justify-center text-white text-[10px] font-medium ring-2 ring-white`}
                        >
                            {avatar.initials}
                        </div>
                    ))}
                </div>
                <span className="ml-3 font-medium text-neutral-700">5,000+ users</span>
            </div>

            {/* Divider */}
            <div className="w-px h-4 bg-neutral-200 hidden sm:block"></div>

            {/* Rating */}
            <div className="flex items-center gap-1">
                <div className="flex">
                    {[...Array(5)].map((_, i) => (
                        <svg
                            key={i}
                            className="w-3.5 h-3.5 text-yellow-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                    ))}
                </div>
                <span className="font-medium text-neutral-700">5.0</span>
            </div>

            {/* Divider */}
            <div className="w-px h-4 bg-neutral-200 hidden sm:block"></div>

            {/* Powered by AI */}
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-neutral-400">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                    </svg>
                </div>
                <span>Powered by AI</span>
            </div>
        </div>
    );
}
