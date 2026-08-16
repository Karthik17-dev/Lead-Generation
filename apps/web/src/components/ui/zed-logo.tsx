import { cn } from '@/lib/utils';
import type { ComponentPropsWithoutRef } from 'react';

export type ZedLogoVariant = 'icon' | 'brandmark';

interface ZedLogoProps
  extends Omit<ComponentPropsWithoutRef<'svg'>, 'width' | 'height' | 'viewBox'> {
  /** Pixel height. The brandmark scales its width to match; the icon is square. */
  size?: number;
  /** `icon` = the Zed symbol alone; `brandmark` = symbol + wordmark lockup. */
  variant?: ZedLogoVariant;
  className?: string;
}

/**
 * The canonical Zed logo. Renders in `currentColor` so it follows the
 * surrounding text color (`text-foreground` in app surfaces).
 *
 * `@/components/sidebar/zed-logo` re-exports this under its legacy
 * `symbol`/`logomark` variant names — new code should import from here.
 */
export function ZedLogo({
  size = 24,
  variant = 'brandmark',
  className,
  style,
  ...props
}: ZedLogoProps) {
  if (variant === 'icon') {
    return (
      <svg
        width="30"
        height="25"
        viewBox="0 0 30 25"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn('shrink-0', className)}
        style={{ width: `${size}px`, height: `${size}px`, ...style }}
        {...props}
      >
        <path
          d="M25.5614 24.916H29.8268C29.8268 19.6306 26.9378 15.0039 22.6171 12.4587C26.9377 9.91355 29.8267 5.28685 29.8267 0.00146484H25.5613C25.5613 5.00287 21.8906 9.18692 17.0654 10.1679V0.00146484H12.8005V10.1679C7.9526 9.20401 4.3046 5.0186 4.3046 0.00146484H0.0391572C0.0391572 5.28685 2.92822 9.91355 7.24884 12.4587C2.92818 15.0039 0.0390625 19.6306 0.0390625 24.916H4.30451C4.30451 19.8989 7.95259 15.7135 12.8005 14.7496V24.9206H17.0654V14.7496C21.9133 15.7134 25.5614 19.8989 25.5614 24.916Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  return (
    <span
      className={cn('inline-flex items-center gap-2.5 font-bold tracking-tight select-none', className)}
      style={{ height: `${size}px`, ...style }}
    >
      <svg
        width="30"
        height="25"
        viewBox="0 0 30 25"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        style={{ width: `${size}px`, height: `${size}px` }}
        {...props}
      >
        <path
          d="M25.5614 24.916H29.8268C29.8268 19.6306 26.9378 15.0039 22.6171 12.4587C26.9377 9.91355 29.8267 5.28685 29.8267 0.00146484H25.5613C25.5613 5.00287 21.8906 9.18692 17.0654 10.1679V0.00146484H12.8005V10.1679C7.9526 9.20401 4.3046 5.0186 4.3046 0.00146484H0.0391572C0.0391572 5.28685 2.92822 9.91355 7.24884 12.4587C2.92818 15.0039 0.0390625 19.6306 0.0390625 24.916H4.30451C4.30451 19.8989 7.95259 15.7135 12.8005 14.7496V24.9206H17.0654V14.7496C21.9133 15.7134 25.5614 19.8989 25.5614 24.916Z"
          fill="currentColor"
        />
      </svg>
      <span className="text-foreground tracking-tight font-semibold" style={{ fontSize: `${Math.round(size * 0.88)}px`, lineHeight: 1 }}>
        Zed
      </span>
    </span>
  );
}
