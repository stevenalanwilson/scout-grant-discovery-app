import { useState } from 'react';
import type { CreateGroupInput, Section, FundingPurpose } from '@scout-grants/shared';
import { SectionsField } from './SectionsField';
import { FundingPurposesField } from './FundingPurposesField';

interface FormValues {
  name: string;
  membershipNumber: string;
  charityNumber: string;
  postcode: string;
  membershipCount: string;
  sections: Section[];
  fundingPurposes: FundingPurpose[];
  additionalContext: string;
}

interface FormErrors {
  name?: string;
  membershipNumber?: string;
  charityNumber?: string;
  postcode?: string;
  membershipCount?: string;
  sections?: string;
  fundingPurposes?: string;
  additionalContext?: string;
}

interface ProfileFormProps {
  initialValues?: Partial<FormValues>;
  onSubmit: (input: CreateGroupInput) => Promise<void>;
  submitLabel: string;
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.name.trim()) errors.name = 'Group name is required.';
  if (!values.membershipNumber.trim()) errors.membershipNumber = 'Membership number is required.';
  if (!values.postcode.trim()) errors.postcode = 'Postcode is required.';

  const count = parseInt(values.membershipCount, 10);
  if (!values.membershipCount || isNaN(count) || count < 1) {
    errors.membershipCount = 'Enter a valid membership count (minimum 1).';
  }

  if (values.sections.length === 0) errors.sections = 'Select at least one section.';
  if (values.fundingPurposes.length === 0)
    errors.fundingPurposes = 'Select at least one funding purpose.';

  if (values.additionalContext.length > 300) {
    errors.additionalContext = 'Additional context must be 300 characters or fewer.';
  }

  return errors;
}

const EMPTY: FormValues = {
  name: '',
  membershipNumber: '',
  charityNumber: '',
  postcode: '',
  membershipCount: '',
  sections: [],
  fundingPurposes: [],
  additionalContext: '',
};

export function ProfileForm({
  initialValues,
  onSubmit,
  submitLabel,
}: ProfileFormProps): React.ReactElement {
  const [values, setValues] = useState<FormValues>({ ...EMPTY, ...initialValues });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function setField<K extends keyof FormValues>(key: K, value: FormValues[K]): void {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const validationErrors = validate(values);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      await onSubmit({
        name: values.name.trim(),
        membershipNumber: values.membershipNumber.trim(),
        charityNumber: values.charityNumber.trim() || null,
        postcode: values.postcode.trim(),
        sections: values.sections,
        membershipCount: parseInt(values.membershipCount, 10),
        fundingPurposes: values.fundingPurposes,
        additionalContext: values.additionalContext.trim() || null,
      });
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  const remaining = 300 - values.additionalContext.length;

  return (
    <form onSubmit={handleSubmit} noValidate>
      {submitError && (
        <div className="alert alert-error" role="alert">
          {submitError}
        </div>
      )}

      <div className="form-section">
        <h2 className="form-section-title">Group details</h2>

        <div className="field">
          <label htmlFor="name" className="field-label">
            Group name{' '}
            <span className="required" aria-hidden="true">
              *
            </span>
          </label>
          <input
            id="name"
            type="text"
            className={`input ${errors.name ? 'input-error' : ''}`}
            value={values.name}
            onChange={(e) => setField('name', e.target.value)}
            autoComplete="organization"
            aria-required="true"
          />
          {errors.name && (
            <p className="field-error" role="alert">
              {errors.name}
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor="membershipNumber" className="field-label">
            Scout Association membership number{' '}
            <span className="required" aria-hidden="true">
              *
            </span>
          </label>
          <input
            id="membershipNumber"
            type="text"
            className={`input ${errors.membershipNumber ? 'input-error' : ''}`}
            value={values.membershipNumber}
            onChange={(e) => setField('membershipNumber', e.target.value)}
            aria-required="true"
          />
          {errors.membershipNumber && (
            <p className="field-error" role="alert">
              {errors.membershipNumber}
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor="charityNumber" className="field-label">
            Charity number
            <span className="field-optional"> (optional — England &amp; Wales only)</span>
          </label>
          <input
            id="charityNumber"
            type="text"
            className={`input ${errors.charityNumber ? 'input-error' : ''}`}
            value={values.charityNumber}
            onChange={(e) => setField('charityNumber', e.target.value)}
            placeholder="e.g. 1234567 or SC000088"
          />
          {errors.charityNumber && (
            <p className="field-error" role="alert">
              {errors.charityNumber}
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor="postcode" className="field-label">
            Group postcode{' '}
            <span className="required" aria-hidden="true">
              *
            </span>
          </label>
          <input
            id="postcode"
            type="text"
            className={`input input-sm ${errors.postcode ? 'input-error' : ''}`}
            value={values.postcode}
            onChange={(e) => setField('postcode', e.target.value)}
            autoComplete="postal-code"
            placeholder="e.g. DE1 1AA"
            aria-required="true"
          />
          {errors.postcode && (
            <p className="field-error" role="alert">
              {errors.postcode}
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor="membershipCount" className="field-label">
            Approximate membership count{' '}
            <span className="required" aria-hidden="true">
              *
            </span>
          </label>
          <input
            id="membershipCount"
            type="number"
            min="1"
            className={`input input-sm ${errors.membershipCount ? 'input-error' : ''}`}
            value={values.membershipCount}
            onChange={(e) => setField('membershipCount', e.target.value)}
            aria-required="true"
          />
          {errors.membershipCount && (
            <p className="field-error" role="alert">
              {errors.membershipCount}
            </p>
          )}
        </div>

        <SectionsField
          value={values.sections}
          onChange={(s) => setField('sections', s)}
          error={errors.sections}
        />
      </div>

      <div className="form-section">
        <h2 className="form-section-title">Funding needs</h2>

        <FundingPurposesField
          value={values.fundingPurposes}
          onChange={(p) => setField('fundingPurposes', p)}
          error={errors.fundingPurposes}
        />

        <div className="field">
          <label htmlFor="additionalContext" className="field-label">
            Additional context
            <span className="field-optional"> (optional)</span>
          </label>
          <p className="field-hint">
            Anything specific you are looking to fund that the categories above don&apos;t capture.
          </p>
          <textarea
            id="additionalContext"
            className={`input textarea ${errors.additionalContext ? 'input-error' : ''}`}
            value={values.additionalContext}
            onChange={(e) => setField('additionalContext', e.target.value)}
            rows={4}
            maxLength={320}
          />
          <p className={`char-count ${remaining < 0 ? 'char-count-over' : ''}`}>
            {remaining} characters remaining
          </p>
          {errors.additionalContext && (
            <p className="field-error" role="alert">
              {errors.additionalContext}
            </p>
          )}
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
