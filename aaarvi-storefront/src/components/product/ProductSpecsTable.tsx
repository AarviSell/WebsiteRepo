// src/components/product/ProductSpecsTable.tsx

interface ProductSpecsTableProps {
  specifications: Record<string, string>;
}

export function ProductSpecsTable({ specifications }: ProductSpecsTableProps) {
  const entries = Object.entries(specifications);

  if (entries.length === 0) return null;

  return (
    <table
      style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: 'var(--text-sm)',
      }}
      aria-label="Product specifications"
    >
      <tbody>
        {entries.map(([key, value], i) => (
          <tr
            key={key}
            style={{
              background: i % 2 === 0 ? 'var(--color-surface-2)' : 'transparent',
            }}
          >
            <th
              scope="row"
              style={{
                padding: 'var(--space-2) var(--space-3)',
                textAlign: 'left',
                fontWeight: 500,
                color: 'var(--color-text-muted)',
                width: '40%',
                verticalAlign: 'top',
              }}
            >
              {key}
            </th>
            <td
              style={{
                padding: 'var(--space-2) var(--space-3)',
                color: 'var(--color-text)',
                verticalAlign: 'top',
              }}
            >
              {value}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
