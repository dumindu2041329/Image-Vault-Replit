import React, { useState, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { Upload, Trash2, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export function ProfileImageUpload() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState(user?.user_metadata?.avatar_url || '')

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file || !user) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file.",
        variant: "destructive",
      })
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      })
      return
    }

    setUploading(true)

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/avatar.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      const avatarUrl = data.publicUrl

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: avatarUrl }
      })

      if (updateError) {
        throw updateError
      }

      setImageUrl(avatarUrl)
      toast({
        title: "Profile image updated",
        description: "Your profile image has been updated successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload profile image.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }, [user, toast])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: false
  })

  const handleRemoveImage = async () => {
    if (!user) return

    setUploading(true)

    try {
      // Update user metadata to remove avatar
      const { error } = await supabase.auth.updateUser({
        data: { avatar_url: null }
      })

      if (error) {
        throw error
      }

      setImageUrl('')
      toast({
        title: "Profile image removed",
        description: "Your profile image has been removed.",
      })
    } catch (error: any) {
      toast({
        title: "Failed to remove image",
        description: error.message || "Failed to remove profile image.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const getInitials = (email: string) => {
    return email.split('@')[0].charAt(0).toUpperCase()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-6">
        <Avatar className="w-24 h-24">
          <AvatarImage src={imageUrl} alt="Profile" />
          <AvatarFallback className="text-2xl">
            {user?.email ? getInitials(user.email) : <User size={32} />}
          </AvatarFallback>
        </Avatar>
        
        <div className="space-y-2">
          <h3 className="font-semibold">Profile Picture</h3>
          <p className="text-sm text-muted-foreground">
            Upload a new profile picture or remove the current one.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">
            {isDragActive ? 'Drop the image here' : 'Upload a new image'}
          </p>
          <p className="text-sm text-muted-foreground">
            Drag and drop an image, or click to browse. Max size: 5MB
          </p>
        </div>

        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()}
            disabled={uploading}
          >
            <Upload size={16} className="mr-2" />
            Choose File
          </Button>
          
          {imageUrl && (
            <Button
              variant="destructive"
              onClick={handleRemoveImage}
              disabled={uploading}
            >
              <Trash2 size={16} className="mr-2" />
              Remove Image
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}