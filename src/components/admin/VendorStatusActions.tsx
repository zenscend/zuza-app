'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { updateVendorStatus } from '@/services/vendorService'
import type { VendorStatus } from '@/types'

interface Props {
  vendorId: string
  currentStatus: VendorStatus
}

const ACTIONS: { label: string; status: VendorStatus; variant: 'default' | 'secondary' | 'destructive' | 'outline' }[] = [
  { label: 'Activate',   status: 'active',   variant: 'default' },
  { label: 'Deactivate', status: 'inactive', variant: 'secondary' },
  { label: 'Reject',     status: 'rejected', variant: 'destructive' },
  { label: 'Mark pending', status: 'pending', variant: 'outline' },
]

export function VendorStatusActions({ vendorId, currentStatus }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<VendorStatus | null>(null)

  async function handleChange(status: VendorStatus) {
    setLoading(status)
    try {
      const supabase = createClient()
      await updateVendorStatus(supabase, vendorId, status)
      router.refresh()
    } catch (err) {
      console.error('Status update failed:', (err as any)?.message)
    } finally {
      setLoading(null)
    }
  }

  const available = ACTIONS.filter((a) => a.status !== currentStatus)

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {available.map(({ label, status, variant }) => (
        <Button
          key={status}
          variant={variant}
          size="sm"
          disabled={loading !== null}
          onClick={() => handleChange(status)}
        >
          {loading === status ? 'Saving...' : label}
        </Button>
      ))}
    </div>
  )
}
