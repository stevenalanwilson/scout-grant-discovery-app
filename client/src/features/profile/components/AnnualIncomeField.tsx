const INCOME_OPTIONS = [
  { value: 5000, label: 'Under £10,000' },
  { value: 25000, label: '£10,000–£50,000' },
  { value: 75000, label: '£50,000–£100,000' },
  { value: 250000, label: '£100,000–£500,000' },
  { value: 750000, label: '£500,000–£1,000,000' },
  { value: 1500000, label: 'Over £1,000,000' },
];

interface AnnualIncomeFieldProps {
  value: number | null;
  onChange: (value: number | null) => void;
  error?: string;
}

export function AnnualIncomeField({
  value,
  onChange,
  error,
}: AnnualIncomeFieldProps): React.ReactElement {
  return (
    <div className="field">
      <label htmlFor="annualIncome" className="field-label">
        Annual income
        <span className="field-optional"> (optional)</span>
      </label>
      <p className="field-hint">
        From your most recent accounts. Used to match income thresholds on grants.
      </p>
      <select
        id="annualIncome"
        className={`input ${error ? 'input-error' : ''}`}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      >
        <option value="">Select a range…</option>
        {INCOME_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
