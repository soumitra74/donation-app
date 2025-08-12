import React from 'react'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode
}

export function Select({ className = '', children, ...props }: SelectProps) {
  const classes = `flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`
  
  return (
    <select className={classes} {...props}>
      {children}
    </select>
  )
}

export function SelectTrigger({ className = '', children, ...props }: SelectProps) {
  return <Select className={className} {...props}>{children}</Select>
}

export function SelectContent({ className = '', children, ...props }: SelectProps) {
  return <div className={className} {...props}>{children}</div>
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  return <option value="">{placeholder}</option>
}

export function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
  return <option value={value}>{children}</option>
}
