'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { VendorStatusBadge } from './VendorStatusBadge'
import { useVendors } from '@/hooks/useVendors'
import type { VendorStatus } from '@/types'
import { MoreHorizontal } from 'lucide-react'

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  kota_outlet: 'Kota Outlet',
  chisanyama: 'Chisanyama',
  street_food: 'Street Food',
  spaza_shop: 'Spaza Shop',
  other: 'Other',
}

const STATUS_FILTERS: { label: string; value: VendorStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Rejected', value: 'rejected' },
]

export function VendorTable() {
  const router = useRouter()
  const [activeFilter, setActiveFilter] = useState<VendorStatus | 'all'>('all')
  const { vendors, loading, error, changeStatus } = useVendors(
    activeFilter === 'all' ? undefined : activeFilter
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        Loading vendors...
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_FILTERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setActiveFilter(value)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              activeFilter === value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            {label}
          </button>
        ))}
        <span className="ml-auto text-sm text-muted-foreground">
          {vendors.length} {vendors.length === 1 ? 'vendor' : 'vendors'}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Business</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Onboarded</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                  No vendors found
                </TableCell>
              </TableRow>
            ) : (
              vendors.map((vendor) => (
                <TableRow
                  key={vendor.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/admin/vendors/${vendor.id}`)}
                >
                  <TableCell className="font-medium">{vendor.business_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {BUSINESS_TYPE_LABELS[vendor.business_type] ?? vendor.business_type}
                    </Badge>
                  </TableCell>
                  <TableCell>{vendor.owner_name}</TableCell>
                  <TableCell className="font-mono text-sm">{vendor.phone_number}</TableCell>
                  <TableCell>{vendor.city}</TableCell>
                  <TableCell>
                    <VendorStatusBadge status={vendor.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(vendor.created_at).toLocaleDateString('en-ZA', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </TableCell>
                  <TableCell
                    onClick={(e) => e.stopPropagation()} // prevent row nav when opening menu
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground border-b border-border mb-1">
                          Change status
                        </div>
                        {vendor.status !== 'active' && (
                          <DropdownMenuItem onClick={() => changeStatus(vendor.id, 'active')}>
                            Activate
                          </DropdownMenuItem>
                        )}
                        {vendor.status !== 'pending' && (
                          <DropdownMenuItem onClick={() => changeStatus(vendor.id, 'pending')}>
                            Mark pending
                          </DropdownMenuItem>
                        )}
                        {vendor.status !== 'inactive' && (
                          <DropdownMenuItem onClick={() => changeStatus(vendor.id, 'inactive')}>
                            Deactivate
                          </DropdownMenuItem>
                        )}
                        {vendor.status !== 'rejected' && (
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => changeStatus(vendor.id, 'rejected')}
                          >
                            Reject
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
