import { Badge } from '@/components/ui/badge'
import type { VendorStatus } from '@/types'

const STATUS_CONFIG: Record<VendorStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
  pending:  { label: 'Pending',  variant: 'outline',     className: 'border-yellow-400 text-yellow-600 bg-yellow-50' },
  active:   { label: 'Active',   variant: 'default',     className: 'bg-green-500 hover:bg-green-500 text-white' },
  inactive: { label: 'Inactive', variant: 'secondary',   className: '' },
  rejected: { label: 'Rejected', variant: 'destructive', className: '' },
}

export function VendorStatusBadge({ status }: { status: VendorStatus }) {
  const config = STATUS_CONFIG[status]
  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  )
}
