import React, { useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useLocation } from 'wouter'
import { Skeleton } from '@/components/ui/skeleton'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const [, setLocation] = useLocation()

  useEffect(() => {
    if (!loading && !user) {
      setLocation('/auth')
    }
  }, [user, loading, setLocation])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}