"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  children: React.ReactNode
  className?: string
}

interface SelectTriggerProps {
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

interface SelectContentProps {
  children: React.ReactNode
  className?: string
}

interface SelectValueProps {
  placeholder?: string
  children?: React.ReactNode
}

interface SelectItemProps {
  value: string
  children: React.ReactNode
  disabled?: boolean
}

export function Select({ value, onValueChange, disabled, children, className }: SelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedValue, setSelectedValue] = React.useState(value || "")
  const [useNativeSelect, setUseNativeSelect] = React.useState(false)
  const selectRef = React.useRef<HTMLDivElement>(null)

  // Detect mobile devices and use native select as fallback
  React.useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    if (isMobile) {
      setUseNativeSelect(true)
    }
  }, [])

  React.useEffect(() => {
    setSelectedValue(value || "")
  }, [value])

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    // Use both mouse and touch events for better mobile support
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("touchend", handleClickOutside)
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("touchend", handleClickOutside)
    }
  }, [])

  const handleSelect = (newValue: string) => {
    setSelectedValue(newValue)
    setIsOpen(false)
    if (onValueChange) {
      onValueChange(newValue)
    }
  }

  const handleToggle = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsOpen(!isOpen)
    }
  }

  const selectedChild = React.Children.toArray(children).find((child) => {
    if (React.isValidElement(child) && child.type === SelectValue) {
      return (child.props as any).value === selectedValue
    }
    return false
  })

  // Use native select for mobile devices
  if (useNativeSelect) {
    const handleNativeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (onValueChange) {
        onValueChange(e.target.value)
      }
    }

    return (
      <select 
        value={selectedValue} 
        onChange={handleNativeChange}
        disabled={disabled}
        className={`flex h-12 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className || ""}`}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child) && child.type === SelectContent) {
            return React.Children.map(child.props.children, (item) => {
              if (React.isValidElement(item) && item.type === SelectItem) {
                return (
                  <option key={(item.props as any).value} value={(item.props as any).value}>
                    {(item.props as any).children}
                  </option>
                )
              }
              return null
            })
          }
          return null
        })}
      </select>
    )
  }

  return (
    <div ref={selectRef} className={`relative ${className || ""}`}>
      <div
        className={`flex h-12 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation ${
          isOpen ? "ring-2 ring-blue-500" : ""
        } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
        onClick={handleToggle}
        onTouchStart={handleToggle}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="block truncate">
          {selectedChild ? React.cloneElement(selectedChild as React.ReactElement, {}) : "Select an option"}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </div>
      
      {isOpen && !disabled && (
        <div 
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-300 bg-white py-1 shadow-lg touch-manipulation"
          role="listbox"
        >
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child) && child.type === SelectContent) {
              return React.cloneElement(child, {
                onSelect: handleSelect,
                selectedValue
              } as any)
            }
            return null
          })}
        </div>
      )}
    </div>
  )
}

export function SelectTrigger({ children, className, disabled }: SelectTriggerProps) {
  return <div className={className}>{children}</div>
}

export function SelectContent({ children, className, onSelect, selectedValue }: SelectContentProps & { onSelect?: (value: string) => void; selectedValue?: string }) {
  return (
    <div className={className}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === SelectItem) {
          return React.cloneElement(child, {
            onSelect,
            isSelected: child.props.value === selectedValue
          } as any)
        }
        return child
      })}
    </div>
  )
}

export function SelectValue({ placeholder, children }: SelectValueProps) {
  return <span>{children || placeholder}</span>
}

export function SelectItem({ value, children, disabled, onSelect, isSelected }: SelectItemProps & { onSelect?: (value: string) => void; isSelected?: boolean }) {
  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled && onSelect) {
      onSelect(value)
    }
  }

  return (
    <div
      className={`relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100 touch-manipulation ${
        isSelected ? "bg-blue-50 text-blue-900" : ""
      } ${disabled ? "pointer-events-none opacity-50" : ""}`}
      onClick={handleClick}
      onTouchStart={handleClick}
      role="option"
      aria-selected={isSelected}
      tabIndex={disabled ? -1 : 0}
    >
      {children}
    </div>
  )
}
