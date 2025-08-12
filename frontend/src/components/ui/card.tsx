import React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function Card({ className = '', children, ...props }: CardProps) {
  const classes = `rounded-lg border border-gray-200 bg-white text-gray-950 shadow-sm ${className}`
  return <div className={classes} {...props}>{children}</div>
}

export function CardHeader({ className = '', children, ...props }: CardProps) {
  const classes = `flex flex-col space-y-1.5 p-6 ${className}`
  return <div className={classes} {...props}>{children}</div>
}

export function CardTitle({ className = '', children, ...props }: CardProps) {
  const classes = `text-2xl font-semibold leading-none tracking-tight ${className}`
  return <h3 className={classes} {...props}>{children}</h3>
}

export function CardDescription({ className = '', children, ...props }: CardProps) {
  const classes = `text-sm text-gray-500 ${className}`
  return <p className={classes} {...props}>{children}</p>
}

export function CardContent({ className = '', children, ...props }: CardProps) {
  const classes = `p-6 pt-0 ${className}`
  return <div className={classes} {...props}>{children}</div>
}
