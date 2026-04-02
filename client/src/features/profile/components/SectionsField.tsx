import type { Section } from '@scout-grants/shared';

const ALL_SECTIONS: { value: Section; label: string }[] = [
  { value: 'SQUIRRELS', label: 'Squirrels (4–6)' },
  { value: 'BEAVERS', label: 'Beavers (6–8)' },
  { value: 'CUBS', label: 'Cubs (8–10½)' },
  { value: 'SCOUTS', label: 'Scouts (10½–14)' },
  { value: 'EXPLORERS', label: 'Explorers (14–18)' },
  { value: 'NETWORK', label: 'Network (18–25)' },
];

interface SectionsFieldProps {
  value: readonly Section[];
  onChange: (sections: Section[]) => void;
  error?: string;
}

export function SectionsField({ value, onChange, error }: SectionsFieldProps): React.ReactElement {
  function handleChange(section: Section, checked: boolean): void {
    if (checked) {
      onChange([...value, section]);
    } else {
      onChange(value.filter((s) => s !== section));
    }
  }

  return (
    <fieldset className="field-group">
      <legend className="field-label">
        Sections run{' '}
        <span className="required" aria-hidden="true">
          *
        </span>
      </legend>
      <div className="checkbox-group">
        {ALL_SECTIONS.map(({ value: section, label }) => (
          <label key={section} className="checkbox-label">
            <input
              type="checkbox"
              checked={value.includes(section)}
              onChange={(e) => handleChange(section, e.target.checked)}
            />
            {label}
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
