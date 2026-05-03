// src/app/(auth)/login/page.tsx
import { Suspense } from 'react'
import { LoginForm } from './LoginForm'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse" />}>
      <LoginForm />
    </Suspense>
  )
}
