import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

export function ProfileForm() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
  })

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        fullName: user.user_metadata?.full_name || '',
      })
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)

    try {
      // Update user metadata for full name
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { full_name: formData.fullName }
      })

      if (metadataError) {
        throw metadataError
      }

      // Update email if changed
      if (formData.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: formData.email
        })

        if (emailError) {
          throw emailError
        }

        toast({
          title: "Profile updated",
          description: "Your profile has been updated. Please check your new email for confirmation.",
        })
      } else {
        toast({
          title: "Profile updated",
          description: "Your profile information has been updated successfully.",
        })
      }
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            type="text"
            value={formData.fullName}
            onChange={handleInputChange('fullName')}
            placeholder="Enter your full name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange('email')}
            placeholder="Enter your email"
            required
          />
          <p className="text-xs text-muted-foreground">
            Changing your email will require verification
          </p>
        </div>
      </div>

      <div className="pt-4">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Update Profile
        </Button>
      </div>
    </form>
  )
}