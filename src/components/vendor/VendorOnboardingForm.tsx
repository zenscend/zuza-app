'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { createVendor } from '@/services/vendorService'
import {
  SA_PROVINCES,
  POS_PROVIDERS,
  PAYMENT_METHODS,
  ORDER_VOLUMES,
  STOCK_ORDER_METHODS,
  CONTACT_PREFERENCES,
  type ProductLine,
} from '@/types'
import type { BusinessType, PrimaryProduct } from '@/types'
import { CheckCircle2, MapPin, Loader2, Plus, Trash2 } from 'lucide-react'

const schema = z.object({
  business_name:           z.string().min(2, 'Business name is required'),
  business_type:           z.enum(['kota_outlet', 'chisanyama', 'street_food', 'spaza_shop', 'other']),
  stock_order_method:      z.string().optional(),
  owner_name:              z.string().min(2, 'Owner name is required'),
  phone_number:            z.string().min(10, 'Enter a valid phone number'),
  email:                   z.string().email('Enter a valid email').optional().or(z.literal('')),
  street_address:          z.string().optional(),
  suburb:                  z.string().optional(),
  city:                    z.string().min(2, 'City is required'),
  province:                z.string().optional(),
  trading_spot:            z.string().optional(),
  has_pos:                 z.boolean().optional(),
  pos_provider:            z.string().optional(),
  pos_provider_custom:     z.string().optional(),
  monthly_order_volume:    z.string().optional(),
  notes:                   z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  kota_outlet: 'Kota Outlet',
  chisanyama:  'Chisanyama',
  street_food: 'Street Food',
  spaza_shop:  'Spaza Shop',
  other:       'Other',
}

const QUICK_PRODUCTS: { value: PrimaryProduct; label: string }[] = [
  { value: 'cooking_oil', label: 'Cooking Oil' },
  { value: 'potatoes',    label: 'Potatoes' },
]

interface Props {
  onboardedBy?: string
  cancelHref?: string
  onSuccess?: (vendorId: string) => void
}

export function VendorOnboardingForm({ onboardedBy, cancelHref, onSuccess }: Props) {
  // Product lines — dynamic list [{ name, monthly_spend }]
  const [productLines, setProductLines] = useState<{ name: string; monthly_spend: string }[]>([])

  // Multi-select pill state
  const [selectedPayments, setSelectedPayments] = useState<string[]>([])
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])

  // GPS
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null)

  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const hasPos        = watch('has_pos')
  const posProvider   = watch('pos_provider')

  // ── Product line helpers ────────────────────────────────────────────
  function toggleQuickProduct(label: string) {
    const exists = productLines.findIndex((p) => p.name === label)
    if (exists >= 0) {
      setProductLines((prev) => prev.filter((_, i) => i !== exists))
    } else {
      setProductLines((prev) => [...prev, { name: label, monthly_spend: '' }])
    }
  }

  function updateLine(index: number, field: 'name' | 'monthly_spend', value: string) {
    setProductLines((prev) => prev.map((p, i) => i === index ? { ...p, [field]: value } : p))
  }

  function removeLine(index: number) {
    setProductLines((prev) => prev.filter((_, i) => i !== index))
  }

  function addEmptyLine() {
    setProductLines((prev) => [...prev, { name: '', monthly_spend: '' }])
  }

  // ── Toggle helpers ──────────────────────────────────────────────────
  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value])
  }

  // ── GPS ─────────────────────────────────────────────────────────────
  function useGPS() {
    if (!navigator.geolocation) return
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGpsLoading(false)
      },
      () => setGpsLoading(false),
      { timeout: 10000 }
    )
  }

  // ── Submit ──────────────────────────────────────────────────────────
  async function onSubmit(values: FormValues) {
    setServerError(null)
    try {
      const supabase = createClient()

      // Resolve POS provider (custom text overrides if "Other")
      const resolvedPosProvider = values.has_pos
        ? (values.pos_provider === 'Other' ? (values.pos_provider_custom || 'Other') : values.pos_provider)
        : undefined

      // Build structured product lines for DB
      const lines: ProductLine[] = productLines
        .filter((p) => p.name.trim() !== '')
        .map((p) => ({
          name: p.name.trim(),
          monthly_spend: p.monthly_spend !== '' ? parseFloat(p.monthly_spend) : undefined,
        }))

      // Quick-select products for the legacy enum column
      const primaryProducts = productLines
        .map((p) => p.name.toLowerCase().replace(' ', '_'))
        .filter((n): n is PrimaryProduct => n === 'cooking_oil' || n === 'potatoes')

      const vendor = await createVendor(supabase, {
        business_name:        values.business_name,
        business_type:        values.business_type as BusinessType,
        stock_order_method:   values.stock_order_method || undefined,
        owner_name:           values.owner_name,
        phone_number:         values.phone_number,
        email:                values.email || undefined,
        street_address:       values.street_address || undefined,
        suburb:               values.suburb || undefined,
        city:                 values.city,
        province:             values.province || undefined,
        trading_spot:         values.trading_spot || undefined,
        coordinates:          gpsCoords ? `(${gpsCoords.lng},${gpsCoords.lat})` : undefined,
        primary_products:     primaryProducts,
        product_lines:        lines,
        has_pos:              values.has_pos,
        pos_provider:         resolvedPosProvider,
        payment_methods:      selectedPayments,
        monthly_order_volume: values.monthly_order_volume || undefined,
        preferred_contact:    selectedContacts,
        notes:                values.notes || undefined,
        onboarded_by:         onboardedBy,
      })
      setSuccess(true)
      onSuccess?.(vendor.id)
    } catch (err) {
      setServerError((err as any)?.message ?? 'Failed to save vendor')
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="rounded-full bg-primary/15 p-4">
          <CheckCircle2 className="h-10 w-10 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-semibold">Vendor registered!</h3>
          <p className="text-muted-foreground mt-1">Added and pending review.</p>
        </div>
        {cancelHref && (
          <Link href={cancelHref} className={cn(buttonVariants({ variant: 'outline' }), 'mt-2')}>
            Back
          </Link>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

      {/* ── 1. Business Information ─────────────────────────────── */}
      <Card>
        <CardHeader><CardTitle className="text-base">Business Information</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="business_name">Business name *</Label>
            <Input id="business_name" placeholder="e.g. Mama's Kota" {...register('business_name')} />
            {errors.business_name && <p className="text-sm text-destructive">{errors.business_name.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="business_type">Business type *</Label>
            <Select onValueChange={(v) => setValue('business_type', v as BusinessType)}>
              <SelectTrigger id="business_type"><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                {Object.entries(BUSINESS_TYPE_LABELS).map(([v, label]) => (
                  <SelectItem key={v} value={v}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.business_type && <p className="text-sm text-destructive">{errors.business_type.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="stock_order_method">How do they currently buy stock?</Label>
            <Select onValueChange={(v) => setValue('stock_order_method', v as string)}>
              <SelectTrigger id="stock_order_method"><SelectValue placeholder="Select method" /></SelectTrigger>
              <SelectContent>
                {STOCK_ORDER_METHODS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ── 2. Owner / Contact ──────────────────────────────────── */}
      <Card>
        <CardHeader><CardTitle className="text-base">Owner / Contact</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="owner_name">Full name *</Label>
            <Input id="owner_name" placeholder="Owner's name" {...register('owner_name')} />
            {errors.owner_name && <p className="text-sm text-destructive">{errors.owner_name.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="phone_number">Phone number *</Label>
            <Input id="phone_number" type="tel" placeholder="e.g. 0821234567" {...register('phone_number')} />
            {errors.phone_number && <p className="text-sm text-destructive">{errors.phone_number.message}</p>}
          </div>

          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="email">Email <span className="text-muted-foreground">(optional)</span></Label>
            <Input id="email" type="email" placeholder="vendor@example.com" {...register('email')} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Preferred contact method</Label>
            <div className="flex flex-wrap gap-2">
              {CONTACT_PREFERENCES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggle(selectedContacts, setSelectedContacts, value)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                    selectedContacts.includes(value)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border hover:bg-accent'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 3. Location ─────────────────────────────────────────── */}
      <Card>
        <CardHeader><CardTitle className="text-base">Location</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="street_address">Street address</Label>
            <Input id="street_address" placeholder="e.g. 12 Main Street" {...register('street_address')} />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="trading_spot">
              Trading spot / stall <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="trading_spot"
              placeholder="e.g. Corner of Vilakazi & Moema, opposite taxi rank"
              {...register('trading_spot')}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="suburb">Suburb</Label>
            <Input id="suburb" placeholder="e.g. Soweto" {...register('suburb')} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="city">City *</Label>
            <Input id="city" placeholder="e.g. Johannesburg" {...register('city')} />
            {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="province">Province</Label>
            <Select onValueChange={(v) => setValue('province', v as string)}>
              <SelectTrigger id="province"><SelectValue placeholder="Select province" /></SelectTrigger>
              <SelectContent>
                {SA_PROVINCES.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* GPS */}
          <div className="space-y-1">
            <Label>Pin location <span className="text-muted-foreground">(optional)</span></Label>
            {gpsCoords ? (
              <div className="flex items-center gap-2 rounded-md border border-primary/40 bg-primary/5 px-3 py-2 text-sm">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <span className="font-mono text-xs">
                  {gpsCoords.lat.toFixed(5)}, {gpsCoords.lng.toFixed(5)}
                </span>
                <button
                  type="button"
                  onClick={() => setGpsCoords(null)}
                  className="ml-auto text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={useGPS}
                disabled={gpsLoading}
                className="flex w-full items-center gap-2 rounded-md border border-dashed border-border px-4 py-2 text-sm text-muted-foreground hover:border-primary hover:text-foreground transition-colors disabled:opacity-50"
              >
                {gpsLoading
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Getting location…</>
                  : <><MapPin className="h-4 w-4" /> Use my current location</>
                }
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── 4. Products & Spend ─────────────────────────────────── */}
      <Card>
        <CardHeader><CardTitle className="text-base">Products & Spend</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {/* Quick-add pills */}
          <div className="space-y-2">
            <Label>Quick-add</Label>
            <div className="flex flex-wrap gap-2">
              {QUICK_PRODUCTS.map(({ label }) => {
                const active = productLines.some((p) => p.name === label)
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toggleQuickProduct(label)}
                    className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                      active
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border hover:bg-accent'
                    }`}
                  >
                    {active ? `✓ ${label}` : `+ ${label}`}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Dynamic product lines */}
          {productLines.length > 0 && (
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_140px_32px] gap-2 text-xs font-medium text-muted-foreground px-1">
                <span>Product</span>
                <span>Est. monthly spend (ZAR)</span>
                <span />
              </div>
              {productLines.map((line, i) => (
                <div key={i} className="grid grid-cols-[1fr_140px_32px] gap-2 items-center">
                  <Input
                    placeholder="Product name"
                    value={line.name}
                    onChange={(e) => updateLine(i, 'name', e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="e.g. 2000"
                    value={line.monthly_spend}
                    onChange={(e) => updateLine(i, 'monthly_spend', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeLine(i)}
                    className="flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={addEmptyLine}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add another product
          </button>
        </CardContent>
      </Card>

      {/* ── 5. Technical Infrastructure ─────────────────────────── */}
      <Card>
        <CardHeader><CardTitle className="text-base">Technical Infrastructure</CardTitle></CardHeader>
        <CardContent className="space-y-4">

          {/* POS toggle */}
          <div className="space-y-2">
            <Label>Do you currently use a Point of Sale (POS) system?</Label>
            <div className="flex gap-2">
              {([true, false] as const).map((val) => (
                <button
                  key={String(val)}
                  type="button"
                  onClick={() => setValue('has_pos', val)}
                  className={`rounded-full border px-5 py-1.5 text-sm font-medium transition-colors ${
                    hasPos === val
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border hover:bg-accent'
                  }`}
                >
                  {val ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>

          {/* POS provider pills — only when hasPos = true */}
          {hasPos === true && (
            <div className="space-y-3">
              <Label>POS provider</Label>
              <div className="flex flex-wrap gap-2">
                {POS_PROVIDERS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setValue('pos_provider', p)}
                    className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                      posProvider === p
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border hover:bg-accent'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              {posProvider === 'Other' && (
                <Input
                  placeholder="Enter POS provider name"
                  {...register('pos_provider_custom')}
                  autoFocus
                />
              )}
            </div>
          )}

          <Separator />

          {/* Payment methods */}
          <div className="space-y-2">
            <Label>How do you currently accept payments?</Label>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggle(selectedPayments, setSelectedPayments, value)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                    selectedPayments.includes(value)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border hover:bg-accent'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 6. Operational Scale ────────────────────────────────── */}
      <Card>
        <CardHeader><CardTitle className="text-base">Operational Scale</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="monthly_order_volume">Estimated average monthly order volume</Label>
            <Select onValueChange={(v) => setValue('monthly_order_volume', v as string)}>
              <SelectTrigger id="monthly_order_volume"><SelectValue placeholder="Select range" /></SelectTrigger>
              <SelectContent>
                {ORDER_VOLUMES.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-1">
            <Label htmlFor="notes">Notes <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea
              id="notes"
              placeholder="Any additional context about this vendor…"
              rows={3}
              {...register('notes')}
            />
          </div>
        </CardContent>
      </Card>

      {serverError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {serverError}
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
        {cancelHref && (
          <Link
            href={cancelHref}
            className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'flex-1 sm:flex-none sm:w-32 justify-center')}
          >
            Cancel
          </Link>
        )}
        <Button type="submit" size="lg" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? 'Registering vendor…' : 'Register vendor'}
        </Button>
      </div>
    </form>
  )
}
