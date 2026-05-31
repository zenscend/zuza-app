import { VendorTable } from '@/components/admin/VendorTable'
import { buttonVariants } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function AdminVendorsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vendors</h1>
          <p className="text-muted-foreground">Manage and review onboarded vendors</p>
        </div>
        <Link href="/admin/vendors/new" className={cn(buttonVariants())}>
          <Plus className="mr-2 h-4 w-4" />
          Add vendor
        </Link>
      </div>
      <VendorTable />
    </div>
  )
}
