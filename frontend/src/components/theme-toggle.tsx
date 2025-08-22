'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Sun, Moon, Monitor, ChevronDown } from 'lucide-react'
import { useTheme } from './theme-provider'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const themes = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'ambient', label: 'Ambient', icon: Monitor },
  ]

  const currentTheme = themes.find(t => t.value === theme)
  const CurrentIcon = currentTheme?.icon || Sun

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 ambient:glass-button ambient:dark:glass-button-dark transition-colors"
      >
        <CurrentIcon className="w-4 h-4" />
        <span className="hidden sm:inline">{currentTheme?.label}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 ambient:glass-card ambient:dark:glass-card-dark border border-slate-200 dark:border-slate-700 rounded-md shadow-lg z-50">
          {themes.map((themeOption) => {
            const Icon = themeOption.icon
            return (
              <button
                key={themeOption.value}
                onClick={() => {
                  setTheme(themeOption.value as 'light' | 'dark' | 'ambient')
                  setIsOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 ambient:hover:bg-white/20 ambient:dark:hover:bg-slate-700/50 transition-colors ${
                  theme === themeOption.value
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 ambient:bg-emerald-600/20 ambient:dark:bg-emerald-400/20 text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{themeOption.label}</span>
                {theme === themeOption.value && (
                  <div className="ml-auto w-2 h-2 bg-emerald-600 dark:bg-emerald-400 rounded-full" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
