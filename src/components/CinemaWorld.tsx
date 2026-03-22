"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import * as THREE from "three"

export default function CinemaWorld() {
    const router = useRouter()
    const containerRef = useRef<HTMLDivElement>(null)
    const statsRef = useRef<HTMLDivElement>(null)
    const [buttonLabel, setButtonLabel] = useState<"开始播放" | "暂停" | "继续">("开始播放")
    const isVideoLoadedRef = useRef(false)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const worldRef = useRef<any>(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const playerRef = useRef<any>(null)

    // Stable play/pause — reads from refs so no stale closures
    const handlePlayPause = useCallback(() => {
        const player = playerRef.current
        const world = worldRef.current
        if (!player || !world) return

        // Resume AudioContext (browser autoplay policy)
        if (world.listener?.context?.state === "suspended") {
            world.listener.context.resume()
        }

        if (!isVideoLoadedRef.current) {
            // First play — hook video texture to screen and disable standby emissive glow
            if (world.screenMaterial && world.videoTexture) {
                world.screenMaterial.color = new THREE.Color("#ffffff")
                world.screenMaterial.map = world.videoTexture
                world.screenMaterial.emissiveIntensity = 0
                world.screenMaterial.needsUpdate = true
            }
            if (world.textMesh) {
                world.textMesh.visible = false
            }
            isVideoLoadedRef.current = true
        }

        if (player.paused()) {
            player.muted(false)
            player.play()
            setButtonLabel("暂停")
        } else {
            player.pause()
            setButtonLabel("继续")
        }
    }, [])

    const handleRefresh = useCallback(() => {
        playerRef.current?.load()
        setButtonLabel("开始播放")
        isVideoLoadedRef.current = false
        const world = worldRef.current
        if (world?.screenMaterial) {
            world.screenMaterial.color = new THREE.Color("#111111")
            world.screenMaterial.map = null
            world.screenMaterial.emissiveIntensity = 1.0
            world.screenMaterial.needsUpdate = true
        }
        if (world?.textMesh) {
            world.textMesh.visible = true
        }
    }, [])

    useEffect(() => {
        if (!containerRef.current || !statsRef.current) return

        let destroyed = false

        const init = async () => {
            const [{ World }, videojsModule] = await Promise.all([import("@/ts/world/World"), import("video.js")])

            if (destroyed) return

            const videoEl = document.getElementById("cinema-video") as HTMLVideoElement
            if (!videoEl) return

            // Init World FIRST — before video.js, so getElementById("cinema-video") still
            // returns the actual <video> element. video.js moves the id to its wrapper div,
            // so calling it second would give World a <div> instead of a <video>.
            const world = new World(document, "world-container", "cinema-stats", "cinema-video", false)
            worldRef.current = world

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const vjsInit = (videojsModule as any).default ?? videojsModule
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const player = (vjsInit as any)(videoEl, {
                techOrder: ["html5"],
                sources: [
                    {
                        src: "http://127.0.0.1:8002/live/movie.m3u8",
                        type: "application/x-mpegURL",
                    },
                ],
                withCredentials: true,
                controls: false,
                autoplay: false,
                preload: "auto",
            })
            playerRef.current = player

            // Space is reserved for character jump — no keyboard shortcut for play/pause
            return () => {}
        }

        const cleanupPromise = init()

        return () => {
            destroyed = true
            cleanupPromise.then((cleanupFn) => cleanupFn?.())
            worldRef.current?.dispose()
            playerRef.current?.dispose()
            worldRef.current = null
            playerRef.current = null
        }
    }, [handlePlayPause])

    return (
        <div className="relative w-screen h-screen overflow-hidden bg-black">
            {/* Hidden video element consumed by Three.js VideoTexture + video.js */}
            <div
                className="absolute overflow-hidden"
                style={{ left: -9999, top: -9999, width: 0, height: 0 }}
                aria-hidden="true"
            >
                <video id="cinema-video" className="video-js" playsInline preload="auto" crossOrigin="anonymous" />
            </div>

            {/* Three.js canvas container */}
            <div id="world-container" ref={containerRef} className="absolute inset-0 w-full h-full" />

            {/* Back to home button */}
            <button
                onClick={() => router.push("/")}
                className="
                    absolute top-4 left-4 z-30
                    h-10 px-5
                    bg-white text-black
                    border-4 border-black
                    font-black text-xs uppercase tracking-widest
                    shadow-[4px_4px_0px_0px_#000]
                    transition-all duration-100
                    active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
                    hover:bg-[#FFD93D]
                "
                aria-label="返回首页"
            >
                ← 返回首页
            </button>

            {/* Stats panel */}
            <div id="cinema-stats" ref={statsRef} className="absolute top-16 left-4 z-30" />

            {/* Play/Refresh controls */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4">
                {/* Play/Pause button */}
                <button
                    onClick={handlePlayPause}
                    className="
                            h-14 px-8
                            bg-[#FF6B6B] text-black
                            border-4 border-black
                            font-black text-sm uppercase tracking-widest
                            shadow-[6px_6px_0px_0px_#000]
                            transition-all duration-100
                            active:translate-x-[3px] active:translate-y-[3px] active:shadow-none
                            hover:bg-[#ff4f4f]
                        "
                    aria-label="播放或暂停"
                >
                    {buttonLabel === "开始播放" ? "▶ 开始播放" : buttonLabel === "暂停" ? "⏸ 暂停" : "▶ 继续"}
                </button>

                {/* Refresh button */}
                <button
                    onClick={handleRefresh}
                    className="
                            h-14 px-6
                            bg-[#FFD93D] text-black
                            border-4 border-black
                            font-black text-sm uppercase tracking-widest
                            shadow-[6px_6px_0px_0px_#000]
                            transition-all duration-100
                            active:translate-x-[3px] active:translate-y-[3px] active:shadow-none
                            hover:bg-[#f5cb00]
                        "
                    aria-label="刷新视频流"
                >
                    ↺ 刷新
                </button>
            </div>

            {/* Navigation help panel */}
            <div className="absolute bottom-6 right-6 z-20 bg-black border-4 border-[#FFD93D] shadow-[6px_6px_0px_0px_#FFD93D] p-4 text-[#FFD93D]">
                <p className="font-black text-xs uppercase tracking-widest mb-3 border-b-2 border-[#FFD93D] pb-2">
                    操作说明
                </p>
                <ul className="space-y-1.5 font-bold text-xs">
                    <li className="flex items-center gap-2">
                        <kbd className="bg-[#FFD93D] text-black px-2 py-0.5 border-2 border-[#FFD93D] font-black">
                            W A S D
                        </kbd>
                        <span>移动小人</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <kbd className="bg-[#FFD93D] text-black px-2 py-0.5 border-2 border-[#FFD93D] font-black">
                            SPACE
                        </kbd>
                        <span>跳跃</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <kbd className="bg-[#FFD93D] text-black px-2 py-0.5 border-2 border-[#FFD93D] font-black">
                            SHIFT
                        </kbd>
                        <span>加速奔跑</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <kbd className="bg-[#FFD93D] text-black px-2 py-0.5 border-2 border-[#FFD93D] font-black">
                            点击画面
                        </kbd>
                        <span>锁定鼠标</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <kbd className="bg-[#FFD93D] text-black px-2 py-0.5 border-2 border-[#FFD93D] font-black">
                            双击
                        </kbd>
                        <span>全屏模式</span>
                    </li>
                </ul>
            </div>

            {/* ESC hint */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-black border-2 border-white/30 px-4 py-2">
                <p className="text-white/60 font-bold text-xs uppercase tracking-wider">按 ESC 可退出鼠标锁定</p>
            </div>
        </div>
    )
}
