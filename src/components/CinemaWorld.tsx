"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import * as THREE from "three"
import { useLang, LangToggle } from "@/contexts/LanguageContext"

export default function CinemaWorld() {
  const router = useRouter()
  const { t } = useLang()
  const containerRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const [playState, setPlayState] = useState<"idle" | "playing" | "paused">("idle")
  const [settingsOpen, setSettingsOpen] = useState(false)
  const debugVisibleRef = useRef(false)
  const isVideoLoadedRef = useRef(false)
  const DEFAULT_STREAM_URL = "http://127.0.0.1:8002/live/movie.m3u8"
  const streamUrlRef = useRef(DEFAULT_STREAM_URL)
  const [inputUrl, setInputUrl] = useState(DEFAULT_STREAM_URL)

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
      setPlayState("playing")
    } else {
      player.pause()
      setPlayState("paused")
    }
  }, [])

  // Ctrl+H toggles stats + dat.GUI panel visibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === "h") {
        e.preventDefault()
        const next = !debugVisibleRef.current
        debugVisibleRef.current = next
        if (statsRef.current) statsRef.current.style.display = next ? "block" : "none"
        const guiEl = worldRef.current?.gui?.domElement as HTMLElement | undefined
        if (guiEl) guiEl.style.display = next ? "block" : "none"
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Load saved stream URL from sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem("cinemaStreamUrl")
    if (saved) {
      setInputUrl(saved)
      streamUrlRef.current = saved
    }
  }, [])

  const handleApplyUrl = useCallback(() => {
    const trimmed = inputUrl.trim()
    if (!trimmed) return
    streamUrlRef.current = trimmed
    sessionStorage.setItem("cinemaStreamUrl", trimmed)
    setSettingsOpen(false)
    const player = playerRef.current
    const world = worldRef.current
    if (!player) return
    player.src([{ src: trimmed, type: "application/x-mpegURL" }])
    player.load()
    setPlayState("idle")
    isVideoLoadedRef.current = false
    if (world?.screenMaterial) {
      world.screenMaterial.color = new THREE.Color("#111111")
      world.screenMaterial.map = null
      world.screenMaterial.emissiveIntensity = 1.0
      world.screenMaterial.needsUpdate = true
    }
    if (world?.textMesh) {
      world.textMesh.visible = true
    }
  }, [inputUrl])

  const handleRefresh = useCallback(() => {
    const player = playerRef.current
    const world = worldRef.current
    if (player) {
      player.src([{ src: streamUrlRef.current, type: "application/x-mpegURL" }])
      player.load()
    }
    setPlayState("idle")
    isVideoLoadedRef.current = false
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
      const [{ World }, videojsModule] = await Promise.all([
        import("@/ts/world/World"),
        import("video.js"),
      ])

      if (destroyed) return

      const videoEl = document.getElementById("cinema-video") as HTMLVideoElement
      if (!videoEl) return

      // Init World FIRST — before video.js, so getElementById("cinema-video") still
      // returns the actual <video> element. video.js moves the id to its wrapper div,
      // so calling it second would give World a <div> instead of a <video>.
      const world = new World(document, "world-container", "cinema-stats", "cinema-video", false)
      worldRef.current = world
      // Hide GUI by default — Ctrl+H reveals it
      if (world.gui?.domElement) {
        world.gui.domElement.style.display = "none"
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const vjsInit = (videojsModule as any).default ?? videojsModule
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const player = (vjsInit as any)(videoEl, {
        techOrder: ["html5"],
        sources: [
          {
            src: streamUrlRef.current,
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
      return () => { }
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
        <video
          id="cinema-video"
          className="video-js"
          playsInline
          preload="auto"
          crossOrigin="anonymous"
        />
      </div>

      {/* Three.js canvas container */}
      <div id="world-container" ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* Back to home + lang toggle */}
      <div className="absolute top-4 left-4 z-30 flex items-center gap-2">
        <button
          onClick={() => router.push("/")}
          className="
                      h-10 px-5
                      bg-white text-black
                      border-4 border-black
                      font-black text-xs uppercase tracking-widest
                      shadow-[4px_4px_0px_0px_#000]
                      transition-all duration-100
                      active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
                      hover:bg-[#FFD93D]
                  "
          aria-label={t.backHome}
        >
          {t.backHome}
        </button>
        <LangToggle />
        <button
          onClick={() => setSettingsOpen(true)}
          className="
                      h-10 px-5
                      bg-white text-black
                      border-4 border-black
                      font-black text-xs uppercase tracking-widest
                      shadow-[4px_4px_0px_0px_#000]
                      transition-all duration-100
                      active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
                      hover:bg-[#FFD93D]
                  "
        >
          {t.settings}
        </button>
      </div>

      {/* Stats panel — Ctrl+H to toggle */}
      <div
        id="cinema-stats"
        ref={statsRef}
        className="absolute top-16 left-4 z-30"
        style={{ display: "none" }}
      />

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
          aria-label={t.play}
        >
          {playState === "idle" ? t.play : playState === "playing" ? t.pause : t.resume}
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
          aria-label={t.refresh}
        >
          {t.refresh}
        </button>
      </div>

      {/* Navigation help panel */}
      <div className="absolute bottom-6 right-6 z-20 bg-black border-4 border-[#FFD93D] shadow-[6px_6px_0px_0px_#FFD93D] p-4 text-[#FFD93D]">
        <p className="font-black text-xs uppercase tracking-widest mb-3 border-b-2 border-[#FFD93D] pb-2">
          {t.controlsTitle}
        </p>
        <ul className="space-y-1.5 font-bold text-xs">
          <li className="flex items-center gap-2">
            <kbd className="bg-[#FFD93D] text-black px-2 py-0.5 border-2 border-[#FFD93D] font-black">
              W A S D
            </kbd>
            <span>{t.moveChar}</span>
          </li>
          <li className="flex items-center gap-2">
            <kbd className="bg-[#FFD93D] text-black px-2 py-0.5 border-2 border-[#FFD93D] font-black">
              SPACE
            </kbd>
            <span>{t.jump}</span>
          </li>
          <li className="flex items-center gap-2">
            <kbd className="bg-[#FFD93D] text-black px-2 py-0.5 border-2 border-[#FFD93D] font-black">
              SHIFT
            </kbd>
            <span>{t.sprint}</span>
          </li>
          <li className="flex items-center gap-2">
            <kbd className="bg-[#FFD93D] text-black px-2 py-0.5 border-2 border-[#FFD93D] font-black">
              {t.clickScreen}
            </kbd>
            <span>{t.lockCursor}</span>
          </li>
          <li className="flex items-center gap-2">
            <kbd className="bg-[#FFD93D] text-black px-2 py-0.5 border-2 border-[#FFD93D] font-black">
              {t.dblClick}
            </kbd>
            <span>{t.fullscreen}</span>
          </li>
        </ul>
      </div>

      {/* ESC hint */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-black border-2 border-white/30 px-4 py-2">
        <p className="text-white/60 font-bold text-xs uppercase tracking-wider">{t.escHint}</p>
      </div>

      {/* Settings modal */}
      {settingsOpen && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setSettingsOpen(false)}
        >
          <div
            className="bg-black border-4 border-[#FFD93D] shadow-[8px_8px_0px_0px_#FFD93D] p-6 w-[480px] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5 border-b-2 border-[#FFD93D] pb-3">
              <p className="font-black text-[#FFD93D] text-sm uppercase tracking-widest">
                {t.settingsTitle}
              </p>
              <button
                onClick={() => setSettingsOpen(false)}
                className="
                  h-8 px-4
                  bg-transparent text-[#FFD93D]
                  border-2 border-[#FFD93D]
                  font-black text-xs uppercase tracking-widest
                  hover:bg-[#FFD93D] hover:text-black
                  transition-colors duration-100
                "
              >
                {t.settingsClose}
              </button>
            </div>

            {/* Stream URL */}
            <div className="flex flex-col gap-2">
              <label className="text-[#FFD93D] font-black text-xs uppercase tracking-widest">
                {t.streamUrlLabel}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  onKeyDown={(e) => {
                    e.stopPropagation()
                    if (e.key === "Enter") handleApplyUrl()
                    if (e.key === "Escape") setSettingsOpen(false)
                  }}
                  placeholder={t.streamUrlPlaceholder}
                  className="
                    flex-1 h-10 px-3
                    bg-black text-white
                    border-4 border-[#FFD93D]
                    font-bold text-xs
                    outline-none
                    focus:border-white
                  "
                  spellCheck={false}
                  autoFocus
                />
                <button
                  onClick={handleApplyUrl}
                  className="
                    h-10 px-5
                    bg-[#FFD93D] text-black
                    border-4 border-black
                    font-black text-xs uppercase tracking-widest
                    shadow-[4px_4px_0px_0px_#000]
                    transition-all duration-100
                    active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
                    hover:bg-[#f5cb00]
                  "
                >
                  {t.applyUrl}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
