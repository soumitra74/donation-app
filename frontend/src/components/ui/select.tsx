import React from 'react'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode
  onValueChange?: (value: string) => void
}

interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function Select({ className = '', children, onValueChange, ...props }: SelectProps) {
  const classes = `flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`
  
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onValueChange) {
      onValueChange(e.target.value)
    }
    if (props.onChange) {
      props.onChange(e)
    }
  }
  
  return (
    <select className={classes} onChange={handleChange} {...props}>
      {children}
    </select>
  )
}

export function SelectTrigger({ className = '', children, ...props }: SelectProps) {
  return <Select className={className} {...props}>{children}</Select>
}

export function SelectContent({ className = '', children, ...props }: SelectContentProps) {
  return <div className={className} {...props}>{children}</div>
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  return <option value="">{placeholder}</option>
}

export function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
  return <option value={value}>{children}</option>
}
