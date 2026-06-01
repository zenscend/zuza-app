import { createClient } from '@/lib/supabase/server'
import { getVendors } from '@/services/vendorService'
import { VendorStatusBadge } from '@/components/admin/VendorStatusBadge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Plus } from 'lucide-react'

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  kota_outlet: 'Kota Outlet',
  chisanyama:  'Chisanyama',
  street_food: 'Street Food',
  spaza_shop:  'Spaza Shop',
  other:       'Other',
}

export default async function MyVendorsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // RLS ensures only vendors onboarded by this agent are returned
  const vendors = await getVendors(supabase)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Vendors</h1>
          <p className="text-muted-foreground">Vendors you&apos;ve onboarded</p>
        </div>
        <Link href="/onboard" className={cn(buttonVariants())}>
          <Plus className="mr-2 h-4 w-4" />
          Onboard vendor
        </Link>
      </div>

      {vendors.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
          <p className="text-muted-foreground">No vendors onboarded yet</p>
          <Link href="/onboard" className={cn(buttonVariants({ variant: 'outline' }))}>
            Register your first vendor
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {vendors.map((vendor) => (
            <Link
              key={vendor.id}
              href={`/my-vendors/${vendor.id}`}
              className="rounded-lg border bg-card p-4 hover:bg-accent/50 transition-colors space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold leading-tight">{vendor.business_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {BUSINESS_TYPE_LABELS[vendor.business_type] ?? vendor.business_type}
                    {vendor.city ? ` · ${vendor.city}` : ''}
                  </p>
                </div>
                <VendorStatusBadge status={vendor.status} />
              </div>
              <p className="text-sm text-muted-foreground">{vendor.owner_name} · {vendor.phone_number}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
