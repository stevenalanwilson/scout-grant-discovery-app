interface ConfirmationFieldProps {
  id: string;
  label: string;
  hint?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

export function ConfirmationField({
  id,
  label,
  hint,
  value,
  onChange,
}: ConfirmationFieldProps): React.ReactElement {
  return (
    <div className="field">
      {hint && <p className="field-hint">{hint}</p>}
      <label className="checkbox-label">
        <input
          id={id}
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
        />
        {label}
      </label>
    </div>
  );
}
