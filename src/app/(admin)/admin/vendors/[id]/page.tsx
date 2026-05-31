import { createClient } from '@/lib/supabase/server'
import { getVendorById } from '@/services/vendorService'
import { getProfile } from '@/services/profileService'
import { VendorStatusBadge } from '@/components/admin/VendorStatusBadge'
import { VendorStatusActions } from '@/components/admin/VendorStatusActions'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  PAYMENT_METHODS,
  ORDER_VOLUMES,
  STOCK_ORDER_METHODS,
  CONTACT_PREFERENCES,
} from '@/types'
import {
  ArrowLeft, Phone, Mail, MapPin, ShoppingBasket,
  Wallet, StickyNote, User, Calendar, MonitorSmartphone,
  CreditCard, TrendingUp, Package, MessageCircle,
} from 'lucide-react'

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  kota_outlet: 'Kota Outlet',
  chisanyama:  'Chisanyama',
  street_food: 'Street Food',
  spaza_shop:  'Spaza Shop',
  other:       'Other',
}

function fmt(n: number | null | undefined) {
  if (!n) return '—'
  return `R ${Number(n).toLocaleString('en-ZA', { minimumFractionDigits: 0 })}`
}

function labelFor<T extends { value: string; label: string }>(
  list: readonly T[],
  value: string
): string {
  return list.find((i) => i.value === value)?.label ?? value
}

export default async function VendorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  let vendor
  try {
    vendor = await getVendorById(supabase, id)
  } catch {
    notFound()
  }

  let onboardedByName: string | null = null
  if (vendor.onboarded_by) {
    try {
      const p = await getProfile(supabase, vendor.onboarded_by)
      onboardedByName = p.full_name
    } catch { /* optional */ }
  }

  const productLines  = vendor.product_lines ?? []
  const totalSpend    = productLines.reduce((s, p) => s + (p.monthly_spend ?? 0), 0)
  const hasProducts   = productLines.length > 0

  const addressParts = [vendor.street_address, vendor.suburb, vendor.city, vendor.province].filter(Boolean)
  const fullAddress  = addressParts.join(', ')

  // Parse GPS coords stored as PostgreSQL point "(lng,lat)"
  let mapsUrl: string | null = null
  if (vendor.coordinates) {
    const match = String(vendor.coordinates).match(/\(?([-\d.]+),([-\d.]+)\)?/)
    if (match) {
      const [, lng, lat] = match
      mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`
    }
  }

  return (
    <div className="max-w-4xl space-y-6">

      {/* ── Back nav ─────────────────────────────────────────── */}
      <Link
        href="/admin/vendors"
        className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2 text-muted-foreground')}
      >
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        All vendors
      </Link>

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{vendor.business_name}</h1>
            <VendorStatusBadge status={vendor.status} />
          </div>
          <p className="text-muted-foreground">
            {BUSINESS_TYPE_LABELS[vendor.business_type] ?? vendor.business_type}
            {vendor.city ? ` · ${vendor.city}` : ''}
            {vendor.province ? `, ${vendor.province}` : ''}
          </p>
        </div>
        <VendorStatusActions vendorId={vendor.id} currentStatus={vendor.status} />
      </div>

      {/* ── At-a-glance stats ────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'Est. monthly spend',
            value: totalSpend > 0 ? fmt(totalSpend) : fmt(vendor.estimated_monthly_spend),
          },
          {
            label: 'Order volume',
            value: vendor.monthly_order_volume
              ? labelFor(ORDER_VOLUMES, vendor.monthly_order_volume).replace(' orders/month', '')
              : '—',
          },
          {
            label: 'POS system',
            value: vendor.has_pos === true ? (vendor.pos_provider ?? 'Yes') : vendor.has_pos === false ? 'No' : '—',
          },
          {
            label: 'Wallet balance',
            value: fmt(vendor.wallet_balance),
          },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg border bg-card p-3 space-y-0.5">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-semibold truncate">{value}</p>
          </div>
        ))}
      </div>

      <Separator />

      {/* ── Main grid ────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2">

        {/* Owner / Contact */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <User className="h-4 w-4 text-muted-foreground" />
              Owner / Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="font-medium text-base">{vendor.owner_name}</p>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              <a href={`tel:${vendor.phone_number}`} className="hover:text-foreground transition-colors">
                {vendor.phone_number}
              </a>
            </div>
            {vendor.email && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <a href={`mailto:${vendor.email}`} className="hover:text-foreground transition-colors">
                  {vendor.email}
                </a>
              </div>
            )}
            {vendor.preferred_contact?.length > 0 && (
              <div className="pt-1 space-y-1.5">
                <p className="text-xs text-muted-foreground font-medium">Preferred contact</p>
                <div className="flex flex-wrap gap-1.5">
                  {vendor.preferred_contact.map((c) => (
                    <Badge key={c} variant="secondary" className="text-xs">
                      {labelFor(CONTACT_PREFERENCES, c)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {fullAddress
              ? <p className="text-muted-foreground leading-relaxed">{fullAddress}</p>
              : <p className="text-muted-foreground italic">No address provided</p>
            }
            {vendor.trading_spot && (
              <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground leading-relaxed">
                <span className="font-medium text-foreground">Trading spot: </span>
                {vendor.trading_spot}
              </div>
            )}
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <MapPin className="h-3 w-3" />
                View on Google Maps
              </a>
            )}
          </CardContent>
        </Card>

        {/* Products & Spend */}
        <Card className="sm:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <ShoppingBasket className="h-4 w-4 text-muted-foreground" />
              Products & Spend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasProducts ? (
              <div className="space-y-1">
                <div className="grid grid-cols-[1fr_auto] gap-4 text-xs font-medium text-muted-foreground px-2 pb-1">
                  <span>Product</span>
                  <span>Est. monthly spend</span>
                </div>
                <Separator />
                {productLines.map((line, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[1fr_auto] gap-4 items-center px-2 py-2 rounded-md hover:bg-muted/40 transition-colors"
                  >
                    <span className="text-sm font-medium">{line.name}</span>
                    <span className="text-sm text-muted-foreground tabular-nums">
                      {line.monthly_spend ? fmt(line.monthly_spend) : '—'}
                    </span>
                  </div>
                ))}
                {totalSpend > 0 && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-[1fr_auto] gap-4 px-2 py-2">
                      <span className="text-sm font-semibold">Total</span>
                      <span className="text-sm font-semibold text-primary tabular-nums">{fmt(totalSpend)}</span>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No products captured</p>
            )}
          </CardContent>
        </Card>

        {/* Stock Sourcing */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Package className="h-4 w-4 text-muted-foreground" />
              Stock Sourcing
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {vendor.stock_order_method ? (
              <Badge variant="outline" className="text-sm font-medium">
                {labelFor(STOCK_ORDER_METHODS, vendor.stock_order_method)}
              </Badge>
            ) : (
              <p className="text-muted-foreground italic">Not captured</p>
            )}
          </CardContent>
        </Card>

        {/* Operational Scale */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Operational Scale
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {vendor.monthly_order_volume ? (
              <Badge variant="outline" className="text-sm font-medium">
                {labelFor(ORDER_VOLUMES, vendor.monthly_order_volume)}
              </Badge>
            ) : (
              <p className="text-muted-foreground italic">Not captured</p>
            )}
          </CardContent>
        </Card>

        {/* Technical Infrastructure */}
        <Card className="sm:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <MonitorSmartphone className="h-4 w-4 text-muted-foreground" />
              Technical Infrastructure
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">POS System</p>
                {vendor.has_pos === true ? (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/30">Active</Badge>
                    {vendor.pos_provider && (
                      <span className="font-medium">{vendor.pos_provider}</span>
                    )}
                  </div>
                ) : vendor.has_pos === false ? (
                  <Badge variant="secondary">No POS</Badge>
                ) : (
                  <p className="text-muted-foreground italic">Not captured</p>
                )}
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Payment Methods</p>
                {vendor.payment_methods?.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {vendor.payment_methods.map((m) => (
                      <Badge key={m} variant="secondary" className="text-xs">
                        {labelFor(PAYMENT_METHODS, m)}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">Not captured</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Wallet */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              Zuza Wallet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{fmt(vendor.wallet_balance)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Available balance</p>
          </CardContent>
        </Card>

        {/* Notes */}
        {vendor.notes && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <StickyNote className="h-4 w-4 text-muted-foreground" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {vendor.notes}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Footer metadata ──────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground pt-2 border-t">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          <span>
            Onboarded {new Date(vendor.created_at).toLocaleDateString('en-ZA', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </span>
        </div>
        {onboardedByName && (
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            <span>by {onboardedByName}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <MessageCircle className="h-3.5 w-3.5" />
          <span>ID: {vendor.id}</span>
        </div>
      </div>
    </div>
  )
}
