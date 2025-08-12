import React from 'react'

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive'
  children: React.ReactNode
}

export function Alert({ variant = 'default', className = '', children, ...props }: AlertProps) {
  const baseClasses = 'relative w-full rounded-lg border p-4'
  const variantClasses = {
    default: 'bg-white text-gray-900 border-gray-200',
    destructive: 'border-red-200 bg-red-50 text-red-900'
  }
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`
  
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  )
}

export function AlertDescription({ className = '', children, ...props }: AlertProps) {
  const classes = `text-sm ${className}`
  return <div className={classes} {...props}>{children}</div>
}
