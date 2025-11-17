'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react'
import enMessages from '@/messages/en.json'
import jaMessages from '@/messages/ja.json'

export type Locale = 'en' | 'ja'

interface LocaleContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  messages: any
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined)

const LOCALE_STORAGE_KEY = 're-auction-locale'

// Preload messages for instant access
const messagesMap = {
  en: enMessages,
  ja: jaMessages,
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  // Always start with 'en' to match SSR
  const [locale, setLocaleState] = useState<Locale>('en')
  const [messages, setMessages] = useState<any>(messagesMap['en'])
  const [mounted, setMounted] = useState(false)

  // Load saved locale from localStorage after mount (client-side only)
  useEffect(() => {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null
    const savedLocale = saved && (saved === 'en' || saved === 'ja') ? saved : 'en'

    if (savedLocale !== locale) {
      setLocaleState(savedLocale)
      setMessages(messagesMap[savedLocale])
    }

    setMounted(true)
  }, [])

  // Sync locale to localStorage when it changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale)
    }
  }, [locale, mounted])

  const setLocale = useCallback((newLocale: Locale) => {
    setMessages(messagesMap[newLocale])
    setLocaleState(newLocale)
  }, [])

  // Memoize context value to prevent unnecessary rerenders
  const value = useMemo(() => ({ locale, setLocale, messages }), [locale, setLocale, messages])

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider')
  }
  return context
}
