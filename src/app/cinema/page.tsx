import dynamic from "next/dynamic"

// Dynamically import with ssr: false to prevent Three.js / window access during SSR
const CinemaWorld = dynamic(() => import("@/components/CinemaWorld"), {
    ssr: false,
    loading: () => (
        <div className="w-screen h-screen bg-black flex items-center justify-center">
            <div className="border-4 border-[#FFD93D] bg-black p-10 text-center shadow-[8px_8px_0px_0px_#FFD93D]">
                <div className="font-black text-[#FFD93D] text-4xl uppercase tracking-tighter mb-4">COM CINEMA</div>
                <div className="font-bold text-white/60 text-sm uppercase tracking-widest">正在加载影院场景…</div>
                <div className="mt-6 flex justify-center gap-2">
                    {[0, 1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="w-3 h-3 bg-[#FF6B6B] border-2 border-[#FF6B6B] animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                        />
                    ))}
                </div>
            </div>
        </div>
    ),
})

export default function CinemaPage() {
    return <CinemaWorld />
}
