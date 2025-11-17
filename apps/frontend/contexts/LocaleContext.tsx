'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
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

// Get initial locale from localStorage (only runs on client)
const getInitialLocale = (): Locale => {
  if (typeof window === 'undefined') return 'en'
  const saved = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null
  return saved && (saved === 'en' || saved === 'ja') ? saved : 'en'
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale)
  const [messages, setMessages] = useState<any>(messagesMap[getInitialLocale()])

  // Sync locale to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale)
    }
  }, [locale])

  const setLocale = (newLocale: Locale) => {
    setMessages(messagesMap[newLocale])
    setLocaleState(newLocale)
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, messages }}>
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
