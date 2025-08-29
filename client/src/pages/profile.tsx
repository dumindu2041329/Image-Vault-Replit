import React, { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Header } from '@/components/header'
import { ProfileImageUpload } from '@/components/profile/profile-image-upload'
import { ProfileForm } from '@/components/profile/profile-form'
import { PasswordForm } from '@/components/profile/password-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User, Lock, Image } from 'lucide-react'

export default function Profile() {
  const { user } = useAuth()

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold gradient-text">Profile Settings</h1>
            <p className="text-muted-foreground mt-2">
              Manage your account settings and preferences
            </p>
          </div>

          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general" className="flex items-center space-x-2">
                <User size={16} />
                <span>General</span>
              </TabsTrigger>
              <TabsTrigger value="image" className="flex items-center space-x-2">
                <Image size={16} />
                <span>Profile Image</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center space-x-2">
                <Lock size={16} />
                <span>Security</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <CardTitle>General Information</CardTitle>
                  <CardDescription>
                    Update your basic account information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProfileForm />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="image">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Image</CardTitle>
                  <CardDescription>
                    Upload or update your profile picture
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProfileImageUpload />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Update your password and security preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PasswordForm />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}