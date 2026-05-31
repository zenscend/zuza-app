import Image from 'next/image'
import { cn } from '@/lib/utils'

interface Props {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

// The logo PNG is 457×481 (near-square). Heights drive sizing;
// width is derived from the real aspect ratio via w-auto so
// nothing gets squished regardless of container size.
const heights = { sm: 36, md: 52, lg: 72 }

export function ZuzaLogo({ className, size = 'md' }: Props) {
  const h = heights[size]
  return (
    <div
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-md px-1.5 py-1',
        'bg-zinc-900 dark:bg-transparent',
        className
      )}
    >
      <Image
        src="/zuza-logo.png"
        alt="Zuza"
        width={457}
        height={481}
        priority
        style={{ height: h, width: 'auto' }}
      />
    </div>
  )
}
