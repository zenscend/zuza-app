'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getVendors, updateVendorStatus } from '@/services/vendorService'
import type { Vendor, VendorStatus } from '@/types'

export function useVendors(statusFilter?: VendorStatus) {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchVendors = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const data = await getVendors(supabase, statusFilter ? { status: statusFilter } : undefined)
      setVendors(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vendors')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchVendors()
  }, [fetchVendors])

  const changeStatus = async (id: string, status: VendorStatus) => {
    const supabase = createClient()
    const updated = await updateVendorStatus(supabase, id, status)
    setVendors((prev) => prev.map((v) => (v.id === id ? updated : v)))
  }

  return { vendors, loading, error, refetch: fetchVendors, changeStatus }
}
