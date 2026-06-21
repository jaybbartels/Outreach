import { Suspense } from 'react'
import CompanyInput from '@/components/CompanyInput'

export const dynamic = 'force-dynamic'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Suspense fallback={<div className="p-6">Loading...</div>}>
        <CompanyInput />
      </Suspense>
    </main>
  )
}
