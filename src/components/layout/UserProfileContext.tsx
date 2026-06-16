'use client'

import { createContext, useContext } from 'react'
import type { Profile } from '@/types'

const UserProfileContext = createContext<Profile | null>(null)

export function useUserProfile(): Profile | null {
  return useContext(UserProfileContext)
}

export function UserProfileProvider({
  children,
  profile,
}: {
  children: React.ReactNode
  profile: Profile
}) {
  return (
    <UserProfileContext.Provider value={profile}>
      {children}
    </UserProfileContext.Provider>
  )
}
