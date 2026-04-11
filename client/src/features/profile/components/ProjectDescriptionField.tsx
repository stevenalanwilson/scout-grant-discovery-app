const MAX_CHARS = 500;

interface ProjectDescriptionFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function ProjectDescriptionField({
  value,
  onChange,
  error,
}: ProjectDescriptionFieldProps): React.ReactElement {
  const remaining = MAX_CHARS - value.length;

  return (
    <div className="field">
      <label htmlFor="specificProjectDescription" className="field-label">
        What do you need funding for?
        <span className="field-optional"> (optional)</span>
      </label>
      <p className="field-hint">
        Describe the specific project or purchase. Include what it is, why it is needed, and
        roughly what it will cost if known. This is used by the eligibility checker.
      </p>
      <textarea
        id="specificProjectDescription"
        className={`input textarea ${error ? 'input-error' : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        maxLength={MAX_CHARS + 20}
      />
      <p className={`char-count ${remaining < 0 ? 'char-count-over' : ''}`}>
        {remaining} characters remaining
      </p>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
