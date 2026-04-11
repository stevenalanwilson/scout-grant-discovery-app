interface EstimatedCostFieldProps {
  value: number | null;
  onChange: (value: number | null) => void;
  error?: string;
}

export function EstimatedCostField({
  value,
  onChange,
  error,
}: EstimatedCostFieldProps): React.ReactElement {
  return (
    <div className="field">
      <label htmlFor="estimatedProjectCost" className="field-label">
        Estimated cost (£)
        <span className="field-optional"> (optional)</span>
      </label>
      <p className="field-hint">Your best estimate for this project or purchase.</p>
      <input
        id="estimatedProjectCost"
        type="number"
        min="0"
        step="1"
        className={`input input-sm ${error ? 'input-error' : ''}`}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value ? Math.round(Number(e.target.value)) : null)}
        placeholder="e.g. 2500"
      />
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
