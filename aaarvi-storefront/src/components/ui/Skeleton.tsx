// src/components/ui/Skeleton.tsx

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ width, height, borderRadius, style }: SkeletonProps) {
  return (
    <div
      className="skeleton"
      style={{
        width: width ?? '100%',
        height: height ?? '1rem',
        borderRadius: borderRadius ?? 'var(--radius-sm)',
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Image */}
      <div
        className="skeleton"
        style={{
          aspectRatio: '4/3',
          width: '100%',
          borderRadius: 0,
        }}
      />
      {/* Content */}
      <div style={{ padding: 'var(--space-3)' }}>
        <Skeleton height="1rem" width="80%" style={{ marginBottom: 'var(--space-2)' }} />
        <Skeleton height="1rem" width="60%" style={{ marginBottom: 'var(--space-3)' }} />
        <Skeleton height="1rem" width="40%" />
      </div>
    </div>
  );
}
