"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { translations, type Lang } from "@/i18n/translations"

interface LanguageContextType {
  lang: Lang
  setLang: (l: Lang) => void
  t: (typeof translations)[Lang]
}

const LanguageContext = createContext<LanguageContextType | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("zh")

  useEffect(() => {
    const saved = localStorage.getItem("lang")
    if (saved === "zh" || saved === "en") setLangState(saved)
  }, [])

  const setLang = (l: Lang) => {
    setLangState(l)
    localStorage.setItem("lang", l)
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error("useLang must be used within LanguageProvider")
  return ctx
}

export function LangToggle() {
  const { lang, setLang } = useLang()
  return (
    <div className="flex items-center border-4 border-black overflow-hidden shadow-[4px_4px_0px_0px_#000]">
      <button
        onClick={() => setLang("zh")}
        className={`px-3 py-1.5 font-black text-xs tracking-widest transition-colors duration-100 ${
          lang === "zh" ? "bg-black text-white" : "bg-white text-black hover:bg-[#FFD93D]"
        }`}
      >
        中
      </button>
      <button
        onClick={() => setLang("en")}
        className={`px-3 py-1.5 font-black text-xs tracking-widest transition-colors duration-100 ${
          lang === "en" ? "bg-black text-white" : "bg-white text-black hover:bg-[#FFD93D]"
        }`}
      >
        EN
      </button>
    </div>
  )
}
