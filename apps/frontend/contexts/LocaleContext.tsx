'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Locale = 'en' | 'ja'

interface LocaleContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  messages: any
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined)

const LOCALE_STORAGE_KEY = 're-auction-locale'

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')
  const [messages, setMessages] = useState<any>({})
  const [isLoading, setIsLoading] = useState(true)

  // Load locale from localStorage and fetch messages
  useEffect(() => {
    const loadLocale = async () => {
      // Get saved locale from localStorage
      const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null
      const initialLocale = savedLocale && (savedLocale === 'en' || savedLocale === 'ja')
        ? savedLocale
        : 'en'

      // Load messages for the locale
      try {
        const messagesModule = await import(`@/messages/${initialLocale}.json`)
        setMessages(messagesModule.default)
        setLocaleState(initialLocale)
      } catch (error) {
        console.error('Failed to load messages:', error)
        // Fallback to English
        const fallbackMessages = await import('@/messages/en.json')
        setMessages(fallbackMessages.default)
        setLocaleState('en')
      }

      setIsLoading(false)
    }

    loadLocale()
  }, [])

  // Change locale and load new messages
  const setLocale = async (newLocale: Locale) => {
    setIsLoading(true)
    try {
      const messagesModule = await import(`@/messages/${newLocale}.json`)
      setMessages(messagesModule.default)
      setLocaleState(newLocale)
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale)
    } catch (error) {
      console.error('Failed to load messages for locale:', newLocale, error)
    }
    setIsLoading(false)
  }

  // Show nothing while loading to avoid flash of wrong language
  if (isLoading) {
    return null
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
