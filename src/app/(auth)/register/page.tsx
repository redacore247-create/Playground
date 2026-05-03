// src/app/(auth)/register/page.tsx
import { Suspense } from 'react'
import { RegisterForm } from './RegisterForm'

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse" />}>
      <RegisterForm />
    </Suspense>
  )
}
