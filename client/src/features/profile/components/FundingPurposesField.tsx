import type { FundingPurpose } from '@scout-grants/shared';

const ALL_PURPOSES: { value: FundingPurpose; label: string; hint: string }[] = [
  { value: 'EQUIPMENT', label: 'Equipment', hint: 'Tents, uniforms, camping gear' },
  { value: 'ACTIVITIES', label: 'Activities', hint: 'Trips, events, programmes' },
  { value: 'INCLUSION', label: 'Inclusion', hint: 'Supporting young people facing barriers' },
  { value: 'FACILITIES', label: 'Facilities', hint: 'Meeting places, huts, buildings' },
  { value: 'COMMUNITY', label: 'Community', hint: 'Local engagement and outreach' },
  { value: 'WELLBEING', label: 'Wellbeing', hint: 'Mental health and welfare projects' },
];

interface FundingPurposesFieldProps {
  value: readonly FundingPurpose[];
  onChange: (purposes: FundingPurpose[]) => void;
  error?: string;
}

export function FundingPurposesField({
  value,
  onChange,
  error,
}: FundingPurposesFieldProps): React.ReactElement {
  function handleChange(purpose: FundingPurpose, checked: boolean): void {
    if (checked) {
      onChange([...value, purpose]);
    } else {
      onChange(value.filter((p) => p !== purpose));
    }
  }

  return (
    <fieldset className="field-group">
      <legend className="field-label">
        Funding purposes{' '}
        <span className="required" aria-hidden="true">
          *
        </span>
      </legend>
      <p className="field-hint">What does your group need funding for?</p>
      <div className="checkbox-group">
        {ALL_PURPOSES.map(({ value: purpose, label, hint }) => (
          <label key={purpose} className="checkbox-label">
            <input
              type="checkbox"
              checked={value.includes(purpose)}
              onChange={(e) => handleChange(purpose, e.target.checked)}
            />
            <span>
              {label}
              <span className="checkbox-hint"> — {hint}</span>
            </span>
          </label>
        ))}
      </div>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}
