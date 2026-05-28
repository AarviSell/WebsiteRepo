// src/components/filters/PriceRangeSlider.tsx
interface PriceRangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
}

export function PriceRangeSlider({ min, max, value, onChange }: PriceRangeSliderProps) {
  const local = value;

  function handleMinChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newMin = Math.min(Number(e.target.value), local[1] - 1);
    onChange([newMin, local[1]]);
  }

  function handleMaxChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newMax = Math.max(Number(e.target.value), local[0] + 1);
    onChange([local[0], newMax]);
  }

  if (min >= max) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <label htmlFor="price-min" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', display: 'block', marginBottom: 'var(--space-1)' }}>
            Min (₹)
          </label>
          <input
            id="price-min"
            type="number"
            min={min}
            max={local[1] - 1}
            value={local[0]}
            onChange={handleMinChange}
            style={{
              width: '100%',
              padding: 'var(--space-2)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              fontSize: 'var(--text-sm)',
              minHeight: 40,
            }}
          />
        </div>
        <span style={{ color: 'var(--color-text-faint)', paddingTop: 'var(--space-4)' }}>—</span>
        <div style={{ flex: 1 }}>
          <label htmlFor="price-max" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', display: 'block', marginBottom: 'var(--space-1)' }}>
            Max (₹)
          </label>
          <input
            id="price-max"
            type="number"
            min={local[0] + 1}
            max={max}
            value={local[1]}
            onChange={handleMaxChange}
            style={{
              width: '100%',
              padding: 'var(--space-2)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              fontSize: 'var(--text-sm)',
              minHeight: 40,
            }}
          />
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={local[0]}
        onChange={handleMinChange}
        aria-label="Minimum price"
        style={{ width: '100%', minHeight: 40, accentColor: 'var(--color-primary)' }}
      />
      <input
        type="range"
        min={min}
        max={max}
        value={local[1]}
        onChange={handleMaxChange}
        aria-label="Maximum price"
        style={{ width: '100%', minHeight: 40, accentColor: 'var(--color-primary)' }}
      />
    </div>
  );
}
