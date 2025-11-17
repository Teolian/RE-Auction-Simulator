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

// Get locale from localStorage synchronously on client, 'en' on server
function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'en'
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null
    return saved && (saved === 'en' || saved === 'ja') ? saved : 'en'
  } catch {
    return 'en'
  }
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  // Initialize with lazy function - reads localStorage immediately on client
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale)
  const [messages, setMessages] = useState<any>(() => messagesMap[getInitialLocale()])

  // Sync locale to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale)
    }
  }, [locale])

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
