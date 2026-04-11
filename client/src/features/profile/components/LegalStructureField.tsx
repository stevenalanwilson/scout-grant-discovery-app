import type { LegalStructure } from '@scout-grants/shared';

interface LegalStructureFieldProps {
  value: LegalStructure | null;
  onChange: (value: LegalStructure | null) => void;
  error?: string;
}

const OPTIONS: { value: LegalStructure; label: string }[] = [
  { value: 'UNINCORPORATED_ASSOCIATION', label: 'Unincorporated association' },
  { value: 'CHARITABLE_INCORPORATED_ORGANISATION', label: 'Charitable Incorporated Organisation (CIO)' },
  { value: 'CHARITABLE_COMPANY_LIMITED_BY_GUARANTEE', label: 'Charitable company limited by guarantee' },
  { value: 'COMMUNITY_INTEREST_COMPANY', label: 'Community Interest Company (CIC)' },
  { value: 'OTHER', label: 'Other' },
];

export function LegalStructureField({
  value,
  onChange,
  error,
}: LegalStructureFieldProps): React.ReactElement {
  return (
    <div className="field">
      <label htmlFor="legalStructure" className="field-label">
        Legal structure
        <span className="field-optional"> (optional)</span>
      </label>
      <p className="field-hint">Most Scout groups are unincorporated associations.</p>
      <select
        id="legalStructure"
        className={`input ${error ? 'input-error' : ''}`}
        value={value ?? ''}
        onChange={(e) => onChange((e.target.value as LegalStructure) || null)}
      >
        <option value="">Select…</option>
        {OPTIONS.map((opt) => (
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
