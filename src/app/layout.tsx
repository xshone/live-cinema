import type { Metadata } from "next"
import { Space_Grotesk } from "next/font/google"
import "./globals.css"

const spaceGrotesk = Space_Grotesk({
    subsets: ["latin"],
    weight: ["400", "500", "700"],
    variable: "--font-space-grotesk",
    display: "swap",
})

export const metadata: Metadata = {
    title: "COM CINEMA — 虚拟影院",
    description: "基于 Three.js + Next.js 构建的沉浸式虚拟 3D 影院体验。HLS 实时直播流，3D 空间音效，自由飞行视角。",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="zh-CN" className={spaceGrotesk.variable}>
            <body className="font-space antialiased">{children}</body>
        </html>
    )
}
