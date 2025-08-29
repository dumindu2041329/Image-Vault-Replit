import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase, initializeSupabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      // Initialize Supabase first
      const initialized = await initializeSupabase()
      
      if (initialized) {
        // Get initial session
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
        setUser(session?.user ?? null)
        
        // Listen for auth changes
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          setSession(session)
          setUser(session?.user ?? null)

          // If user signs in for the first time, ensure they're in the database
          if (event === 'SIGNED_IN' && session?.user) {
            try {
              const response = await fetch(`/api/users/${session.user.id}`)
              if (response.status === 404) {
                // User doesn't exist in database, create them
                await fetch('/api/users', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    id: session.user.id,
                    email: session.user.email,
                    fullName: session.user.user_metadata?.full_name || null,
                    avatarUrl: session.user.user_metadata?.avatar_url || null,
                  }),
                })
              }
            } catch (error) {
              console.error('Failed to sync user with database:', error)
            }
          }
        })

        setLoading(false)
        return () => subscription.unsubscribe()
      } else {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    })

    // If signup was successful and we have a user, store in database
    if (!error && data.user) {
      try {
        await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: data.user.id,
            email: data.user.email,
            fullName: fullName,
            avatarUrl: data.user.user_metadata?.avatar_url || null,
          }),
        })
      } catch (dbError) {
        console.error('Failed to store user in database:', dbError)
        // Don't return error here as the user was created in Supabase Auth
      }
    }

    return { error }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}