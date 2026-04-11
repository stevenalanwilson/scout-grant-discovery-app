import { useRef, useState } from 'react';
import type { CreateGroupInput, Section, FundingPurpose, LegalStructure } from '@scout-grants/shared';
import { SectionsField } from './SectionsField';
import { FundingPurposesField } from './FundingPurposesField';
import { LegalStructureField } from './LegalStructureField';
import { ConfirmationField } from './ConfirmationField';
import { AnnualIncomeField } from './AnnualIncomeField';
import { ProjectDescriptionField } from './ProjectDescriptionField';
import { EstimatedCostField } from './EstimatedCostField';

interface FormValues {
  // Existing
  name: string;
  membershipNumber: string;
  charityNumber: string;
  postcode: string;
  membershipCount: string;
  sections: Section[];
  fundingPurposes: FundingPurpose[];
  additionalContext: string;

  // Category 1: Identity & registration
  legalStructure: LegalStructure | null;
  registeredWithCharityCommission: boolean;
  yearEstablished: string;
  constitutionInPlace: boolean;
  bankAccountInGroupName: boolean;

  // Category 2: Location
  communityServed: string;

  // Category 3: Financial
  annualIncome: number | null;
  annualExpenditure: string;
  financialYearEnd: string;
  hasCurrentAccounts: boolean;
  currentGrantsHeld: string;
  largestSingleFunderPercentage: string;

  // Category 4: Governance
  safeguardingPolicyInPlace: boolean;
  safeguardingPolicyReviewedWithin12Months: boolean;
  equalitiesPolicyInPlace: boolean;
  publicLiabilityInsurance: boolean;
  numberOfTrustees: string;
  trusteesAreUnrelated: boolean;
  hasOutstandingMonitoringReports: boolean;

  // Category 5: Programme
  volunteerCount: string;
  percentageFreeSchoolMeals: string;
  percentageDisabledOrSEND: string;
  specificProjectDescription: string;
  estimatedProjectCost: number | null;
  staffOrPaidWorkers: boolean;
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
  specificProjectDescription?: string;
  estimatedProjectCost?: string;
  annualIncome?: string;
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

  if (values.specificProjectDescription.length > 500) {
    errors.specificProjectDescription = 'Description must be 500 characters or fewer.';
  }

  if (values.estimatedProjectCost !== null) {
    if (!Number.isInteger(values.estimatedProjectCost) || values.estimatedProjectCost < 0) {
      errors.estimatedProjectCost = 'Enter a valid positive amount.';
    }
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

  legalStructure: 'UNINCORPORATED_ASSOCIATION',
  registeredWithCharityCommission: false,
  yearEstablished: '',
  constitutionInPlace: true,
  bankAccountInGroupName: true,

  communityServed: '',

  annualIncome: null,
  annualExpenditure: '',
  financialYearEnd: '',
  hasCurrentAccounts: true,
  currentGrantsHeld: '',
  largestSingleFunderPercentage: '',

  safeguardingPolicyInPlace: true,
  safeguardingPolicyReviewedWithin12Months: true,
  equalitiesPolicyInPlace: true,
  publicLiabilityInsurance: true,
  numberOfTrustees: '',
  trusteesAreUnrelated: true,
  hasOutstandingMonitoringReports: false,

  volunteerCount: '',
  percentageFreeSchoolMeals: '',
  percentageDisabledOrSEND: '',
  specificProjectDescription: '',
  estimatedProjectCost: null,
  staffOrPaidWorkers: false,
};

const CURRENT_YEAR = new Date().getFullYear();

const TABS = [
  { label: 'Group details' },
  { label: 'Registration' },
  { label: 'Finances' },
  { label: 'Community' },
  { label: 'Funding request' },
] as const;

type TabIndex = 0 | 1 | 2 | 3 | 4;

const TAB_ERROR_KEYS: Record<number, (keyof FormErrors)[]> = {
  0: ['name', 'membershipNumber', 'charityNumber', 'postcode', 'membershipCount', 'sections'],
  1: [],
  2: ['annualIncome'],
  3: [],
  4: ['fundingPurposes', 'specificProjectDescription', 'estimatedProjectCost', 'additionalContext'],
};

function findFirstTabWithErrors(errors: FormErrors): TabIndex | null {
  for (let i = 0; i <= 4; i++) {
    if (TAB_ERROR_KEYS[i].some((k) => errors[k] !== undefined)) return i as TabIndex;
  }
  return null;
}

function toNullableInt(value: string): number | null {
  if (!value.trim()) return null;
  const n = parseInt(value, 10);
  return isNaN(n) ? null : n;
}

export function ProfileForm({
  initialValues,
  onSubmit,
  submitLabel,
}: ProfileFormProps): React.ReactElement {
  const [values, setValues] = useState<FormValues>({ ...EMPTY, ...initialValues });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabIndex>(0);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([null, null, null, null, null]);
  const panelContainerRef = useRef<HTMLDivElement>(null);

  function setField<K extends keyof FormValues>(key: K, value: FormValues[K]): void {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (key in errors) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function tabHasError(i: number): boolean {
    return TAB_ERROR_KEYS[i].some((k) => errors[k] !== undefined);
  }

  function switchTab(index: TabIndex): void {
    setActiveTab(index);
    panelContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function handleTabKeyDown(e: React.KeyboardEvent, i: number): void {
    const map: Partial<Record<string, number>> = {
      ArrowRight: (i + 1) % 5,
      ArrowLeft: (i + 4) % 5,
      Home: 0,
      End: 4,
    };
    const next = map[e.key];
    if (next !== undefined) {
      e.preventDefault();
      switchTab(next as TabIndex);
      tabRefs.current[next]?.focus();
    }
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setHasAttemptedSubmit(true);
    const validationErrors = validate(values);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const first = findFirstTabWithErrors(validationErrors);
      if (first !== null) switchTab(first);
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

        legalStructure: values.legalStructure,
        registeredWithCharityCommission: values.registeredWithCharityCommission,
        yearEstablished: toNullableInt(values.yearEstablished),
        constitutionInPlace: values.constitutionInPlace,
        bankAccountInGroupName: values.bankAccountInGroupName,

        communityServed: values.communityServed.trim() || null,

        annualIncome: values.annualIncome,
        annualExpenditure: toNullableInt(values.annualExpenditure),
        financialYearEnd: values.financialYearEnd || null,
        hasCurrentAccounts: values.hasCurrentAccounts,
        currentGrantsHeld: toNullableInt(values.currentGrantsHeld),
        largestSingleFunderPercentage: toNullableInt(values.largestSingleFunderPercentage),

        safeguardingPolicyInPlace: values.safeguardingPolicyInPlace,
        safeguardingPolicyReviewedWithin12Months: values.safeguardingPolicyReviewedWithin12Months,
        equalitiesPolicyInPlace: values.equalitiesPolicyInPlace,
        publicLiabilityInsurance: values.publicLiabilityInsurance,
        numberOfTrustees: toNullableInt(values.numberOfTrustees),
        trusteesAreUnrelated: values.trusteesAreUnrelated,
        hasOutstandingMonitoringReports: values.hasOutstandingMonitoringReports,

        volunteerCount: toNullableInt(values.volunteerCount),
        percentageFreeSchoolMeals: toNullableInt(values.percentageFreeSchoolMeals),
        percentageDisabledOrSEND: toNullableInt(values.percentageDisabledOrSEND),
        specificProjectDescription: values.specificProjectDescription.trim() || null,
        estimatedProjectCost: values.estimatedProjectCost,
        staffOrPaidWorkers: values.staffOrPaidWorkers,
      });
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  const additionalContextRemaining = 300 - values.additionalContext.length;

  return (
    <form onSubmit={handleSubmit} noValidate>
      {submitError && (
        <div className="alert alert-error" role="alert">
          {submitError}
        </div>
      )}

      <div className="tab-container">
        <div role="tablist" aria-label="Profile sections" className="tab-bar">
          {TABS.map((tab, i) => {
            const hasError = hasAttemptedSubmit && tabHasError(i);
            return (
              <button
                key={i}
                type="button"
                role="tab"
                id={`tab-${i}`}
                aria-controls={`tabpanel-${i}`}
                aria-selected={activeTab === i}
                tabIndex={activeTab === i ? 0 : -1}
                ref={(el) => { tabRefs.current[i] = el; }}
                className={[
                  'tab-btn',
                  activeTab === i ? 'tab-btn--active' : '',
                  hasError ? 'tab-btn--error' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => switchTab(i as TabIndex)}
                onKeyDown={(e) => handleTabKeyDown(e, i)}
              >
                {tab.label}
                {hasError && (
                  <span className="tab-error-badge" aria-label="has errors">!</span>
                )}
              </button>
            );
          })}
        </div>

        <p className="tab-progress">Step {activeTab + 1} of {TABS.length}</p>
        <p className="form-required-legend" aria-hidden="true">
          Fields marked <span className="required" aria-hidden="true">*</span> are required.
        </p>

        <div className="tab-panels" ref={panelContainerRef}>

          {/* ── Tab 0: Group details ─────────────────────────────────────────── */}
          <div
            role="tabpanel"
            id="tabpanel-0"
            aria-labelledby="tab-0"
            hidden={activeTab !== 0}
          >
            <div className="form-section">
              <h2 className="form-section-title">Group details</h2>

              <div className="field">
                <label htmlFor="name" className="field-label">
                  Group name{' '}
                  <span className="required" aria-hidden="true">*</span>
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
                {errors.name && <p className="field-error" role="alert">{errors.name}</p>}
              </div>

              <div className="field">
                <label htmlFor="membershipNumber" className="field-label">
                  Scout Association membership number{' '}
                  <span className="required" aria-hidden="true">*</span>
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
                  <p className="field-error" role="alert">{errors.membershipNumber}</p>
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
                  <p className="field-error" role="alert">{errors.charityNumber}</p>
                )}
              </div>

              <div className="field">
                <label htmlFor="postcode" className="field-label">
                  Group postcode{' '}
                  <span className="required" aria-hidden="true">*</span>
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
                {errors.postcode && <p className="field-error" role="alert">{errors.postcode}</p>}
              </div>

              <div className="field">
                <label htmlFor="membershipCount" className="field-label">
                  Approximate membership count{' '}
                  <span className="required" aria-hidden="true">*</span>
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
                  <p className="field-error" role="alert">{errors.membershipCount}</p>
                )}
              </div>

              <SectionsField
                value={values.sections}
                onChange={(s) => setField('sections', s)}
                error={errors.sections}
              />
            </div>
          </div>

          {/* ── Tab 1: Registration ──────────────────────────────────────────── */}
          <div
            role="tabpanel"
            id="tabpanel-1"
            aria-labelledby="tab-1"
            hidden={activeTab !== 1}
          >
            <div className="form-section">
              <h2 className="form-section-title">Registration and governance</h2>

              <LegalStructureField
                value={values.legalStructure}
                onChange={(v) => setField('legalStructure', v)}
              />

              <div className="field">
                <label htmlFor="yearEstablished" className="field-label">
                  Year established
                  <span className="field-optional"> (optional)</span>
                </label>
                <input
                  id="yearEstablished"
                  type="number"
                  min="1800"
                  max={CURRENT_YEAR}
                  className="input input-sm"
                  value={values.yearEstablished}
                  onChange={(e) => setField('yearEstablished', e.target.value)}
                  placeholder="e.g. 1985"
                />
              </div>

              <div className="field">
                <label htmlFor="numberOfTrustees" className="field-label">
                  Number of trustees / committee members
                  <span className="field-optional"> (optional)</span>
                </label>
                <input
                  id="numberOfTrustees"
                  type="number"
                  min="0"
                  className="input input-sm"
                  value={values.numberOfTrustees}
                  onChange={(e) => setField('numberOfTrustees', e.target.value)}
                  placeholder="e.g. 5"
                />
              </div>

              <div className="confirmation-grid">
                <ConfirmationField
                  id="registeredWithCharityCommission"
                  label="Registered with the Charity Commission"
                  hint="Tick if you appear on the Charity Commission register."
                  value={values.registeredWithCharityCommission}
                  onChange={(v) => setField('registeredWithCharityCommission', v)}
                />

                <ConfirmationField
                  id="constitutionInPlace"
                  label="Constitution / governing document in place"
                  value={values.constitutionInPlace}
                  onChange={(v) => setField('constitutionInPlace', v)}
                />

                <ConfirmationField
                  id="bankAccountInGroupName"
                  label="Bank account in the group's name"
                  value={values.bankAccountInGroupName}
                  onChange={(v) => setField('bankAccountInGroupName', v)}
                />

                <ConfirmationField
                  id="trusteesAreUnrelated"
                  label="Trustees / committee members are unrelated individuals"
                  value={values.trusteesAreUnrelated}
                  onChange={(v) => setField('trusteesAreUnrelated', v)}
                />

                <ConfirmationField
                  id="safeguardingPolicyInPlace"
                  label="Safeguarding policy in place"
                  value={values.safeguardingPolicyInPlace}
                  onChange={(v) => setField('safeguardingPolicyInPlace', v)}
                />

                <ConfirmationField
                  id="safeguardingPolicyReviewedWithin12Months"
                  label="Safeguarding policy reviewed within the last 12 months"
                  value={values.safeguardingPolicyReviewedWithin12Months}
                  onChange={(v) => setField('safeguardingPolicyReviewedWithin12Months', v)}
                />

                <ConfirmationField
                  id="equalitiesPolicyInPlace"
                  label="Equalities policy in place"
                  value={values.equalitiesPolicyInPlace}
                  onChange={(v) => setField('equalitiesPolicyInPlace', v)}
                />

                <ConfirmationField
                  id="publicLiabilityInsurance"
                  label="Public liability insurance held"
                  value={values.publicLiabilityInsurance}
                  onChange={(v) => setField('publicLiabilityInsurance', v)}
                />
              </div>

              <ConfirmationField
                id="hasOutstandingMonitoringReports"
                label="Outstanding monitoring reports with a funder"
                hint="Tick only if you have overdue reports owed to a current funder."
                value={values.hasOutstandingMonitoringReports}
                onChange={(v) => setField('hasOutstandingMonitoringReports', v)}
              />
            </div>
          </div>

          {/* ── Tab 2: Finances ──────────────────────────────────────────────── */}
          <div
            role="tabpanel"
            id="tabpanel-2"
            aria-labelledby="tab-2"
            hidden={activeTab !== 2}
          >
            <div className="form-section">
              <h2 className="form-section-title">Financial information</h2>

              <AnnualIncomeField
                value={values.annualIncome}
                onChange={(v) => setField('annualIncome', v)}
                error={errors.annualIncome}
              />

              <div className="field">
                <label htmlFor="annualExpenditure" className="field-label">
                  Annual expenditure (£)
                  <span className="field-optional"> (optional)</span>
                </label>
                <input
                  id="annualExpenditure"
                  type="number"
                  min="0"
                  className="input input-sm"
                  value={values.annualExpenditure}
                  onChange={(e) => setField('annualExpenditure', e.target.value)}
                  placeholder="e.g. 18000"
                />
              </div>

              <div className="field">
                <label htmlFor="financialYearEnd" className="field-label">
                  Financial year end
                  <span className="field-optional"> (optional)</span>
                </label>
                <p className="field-hint">Month and day your financial year ends, e.g. 03-31 for 31 March.</p>
                <select
                  id="financialYearEnd"
                  className="input"
                  value={values.financialYearEnd}
                  onChange={(e) => setField('financialYearEnd', e.target.value)}
                >
                  <option value="">Select…</option>
                  <option value="03-31">31 March</option>
                  <option value="06-30">30 June</option>
                  <option value="09-30">30 September</option>
                  <option value="12-31">31 December</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="currentGrantsHeld" className="field-label">
                  Current active grants
                  <span className="field-optional"> (optional)</span>
                </label>
                <p className="field-hint">Number of grants you are currently receiving funding from.</p>
                <input
                  id="currentGrantsHeld"
                  type="number"
                  min="0"
                  className="input input-sm"
                  value={values.currentGrantsHeld}
                  onChange={(e) => setField('currentGrantsHeld', e.target.value)}
                  placeholder="e.g. 2"
                />
              </div>

              <div className="field">
                <label htmlFor="largestSingleFunderPercentage" className="field-label">
                  Largest single funder (% of income)
                  <span className="field-optional"> (optional)</span>
                </label>
                <p className="field-hint">
                  What percentage of your income comes from your largest single funder?
                </p>
                <input
                  id="largestSingleFunderPercentage"
                  type="number"
                  min="0"
                  max="100"
                  className="input input-sm"
                  value={values.largestSingleFunderPercentage}
                  onChange={(e) => setField('largestSingleFunderPercentage', e.target.value)}
                  placeholder="e.g. 40"
                />
              </div>

              <ConfirmationField
                id="hasCurrentAccounts"
                label="Accounts available (at least one year of financial statements)"
                value={values.hasCurrentAccounts}
                onChange={(v) => setField('hasCurrentAccounts', v)}
              />

              <ConfirmationField
                id="staffOrPaidWorkers"
                label="Group employs paid staff or workers"
                value={values.staffOrPaidWorkers}
                onChange={(v) => setField('staffOrPaidWorkers', v)}
              />
            </div>
          </div>

          {/* ── Tab 3: Community ─────────────────────────────────────────────── */}
          <div
            role="tabpanel"
            id="tabpanel-3"
            aria-labelledby="tab-3"
            hidden={activeTab !== 3}
          >
            <div className="form-section">
              <h2 className="form-section-title">Who you work with</h2>

              <div className="field">
                <label htmlFor="communityServed" className="field-label">
                  Community served
                  <span className="field-optional"> (optional)</span>
                </label>
                <p className="field-hint">
                  Describe the community your group primarily serves, e.g. &ldquo;rural villages in South Derbyshire&rdquo;.
                </p>
                <input
                  id="communityServed"
                  type="text"
                  className="input"
                  value={values.communityServed}
                  onChange={(e) => setField('communityServed', e.target.value)}
                  placeholder="e.g. urban neighbourhood in inner Manchester"
                />
              </div>

              <div className="field">
                <label htmlFor="volunteerCount" className="field-label">
                  Number of volunteers
                  <span className="field-optional"> (optional)</span>
                </label>
                <input
                  id="volunteerCount"
                  type="number"
                  min="0"
                  className="input input-sm"
                  value={values.volunteerCount}
                  onChange={(e) => setField('volunteerCount', e.target.value)}
                  placeholder="e.g. 12"
                />
              </div>

              <div className="field">
                <label htmlFor="percentageFreeSchoolMeals" className="field-label">
                  Members eligible for free school meals (%)
                  <span className="field-optional"> (optional)</span>
                </label>
                <p className="field-hint">Used to assess deprivation context for relevant grants.</p>
                <input
                  id="percentageFreeSchoolMeals"
                  type="number"
                  min="0"
                  max="100"
                  className="input input-sm"
                  value={values.percentageFreeSchoolMeals}
                  onChange={(e) => setField('percentageFreeSchoolMeals', e.target.value)}
                  placeholder="e.g. 25"
                />
              </div>

              <div className="field">
                <label htmlFor="percentageDisabledOrSEND" className="field-label">
                  Members with a disability or SEND (%)
                  <span className="field-optional"> (optional)</span>
                </label>
                <input
                  id="percentageDisabledOrSEND"
                  type="number"
                  min="0"
                  max="100"
                  className="input input-sm"
                  value={values.percentageDisabledOrSEND}
                  onChange={(e) => setField('percentageDisabledOrSEND', e.target.value)}
                  placeholder="e.g. 10"
                />
              </div>
            </div>
          </div>

          {/* ── Tab 4: Funding request ───────────────────────────────────────── */}
          <div
            role="tabpanel"
            id="tabpanel-4"
            aria-labelledby="tab-4"
            hidden={activeTab !== 4}
          >
            <div className="form-section">
              <h2 className="form-section-title">Your funding request</h2>

              <ProjectDescriptionField
                value={values.specificProjectDescription}
                onChange={(v) => setField('specificProjectDescription', v)}
                error={errors.specificProjectDescription}
              />

              <EstimatedCostField
                value={values.estimatedProjectCost}
                onChange={(v) => setField('estimatedProjectCost', v)}
                error={errors.estimatedProjectCost}
              />

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
                  Anything not captured above that may be relevant to grant applications.
                </p>
                <textarea
                  id="additionalContext"
                  className={`input textarea ${errors.additionalContext ? 'input-error' : ''}`}
                  value={values.additionalContext}
                  onChange={(e) => setField('additionalContext', e.target.value)}
                  rows={3}
                  maxLength={320}
                />
                <p className={`char-count ${additionalContextRemaining < 0 ? 'char-count-over' : ''}`}>
                  {additionalContextRemaining} characters remaining
                </p>
                {errors.additionalContext && (
                  <p className="field-error" role="alert">{errors.additionalContext}</p>
                )}
              </div>
            </div>
          </div>

        </div>

        <div className={`tab-footer${activeTab === 0 ? ' tab-footer--end' : ''}`}>
          {activeTab > 0 && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => switchTab((activeTab - 1) as TabIndex)}
            >
              ← Back
            </button>
          )}
          {activeTab < 4 ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => switchTab((activeTab + 1) as TabIndex)}
            >
              Next →
            </button>
          ) : (
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving…' : submitLabel}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
