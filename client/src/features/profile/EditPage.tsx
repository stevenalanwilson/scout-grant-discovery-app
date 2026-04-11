import { useNavigate } from 'react-router-dom';
import type { CreateGroupInput } from '@scout-grants/shared';
import { useProfile } from '../../hooks/useProfile';
import { ProfileForm } from './components/ProfileForm';

export default function EditPage(): React.ReactElement {
  const { profile, isLoading, updateProfile } = useProfile();
  const navigate = useNavigate();

  async function handleSubmit(input: CreateGroupInput): Promise<void> {
    await updateProfile(input);
    navigate('/grants');
  }

  if (isLoading) {
    return (
      <div className="page">
        <p className="loading">Loading profile…</p>
      </div>
    );
  }

  const initialValues = profile
    ? {
        name: profile.name,
        membershipNumber: profile.membershipNumber,
        charityNumber: profile.charityNumber ?? '',
        postcode: profile.postcode,
        membershipCount: String(profile.membershipCount),
        sections: [...profile.sections],
        fundingPurposes: [...profile.fundingPurposes],
        additionalContext: profile.additionalContext ?? '',

        legalStructure: profile.legalStructure,
        registeredWithCharityCommission: profile.registeredWithCharityCommission ?? false,
        yearEstablished: profile.yearEstablished !== null ? String(profile.yearEstablished) : '',
        constitutionInPlace: profile.constitutionInPlace ?? true,
        bankAccountInGroupName: profile.bankAccountInGroupName ?? true,

        communityServed: profile.communityServed ?? '',

        annualIncome: profile.annualIncome,
        annualExpenditure:
          profile.annualExpenditure !== null ? String(profile.annualExpenditure) : '',
        financialYearEnd: profile.financialYearEnd ?? '',
        hasCurrentAccounts: profile.hasCurrentAccounts ?? true,
        currentGrantsHeld:
          profile.currentGrantsHeld !== null ? String(profile.currentGrantsHeld) : '',
        largestSingleFunderPercentage:
          profile.largestSingleFunderPercentage !== null
            ? String(profile.largestSingleFunderPercentage)
            : '',

        safeguardingPolicyInPlace: profile.safeguardingPolicyInPlace ?? true,
        safeguardingPolicyReviewedWithin12Months:
          profile.safeguardingPolicyReviewedWithin12Months ?? true,
        equalitiesPolicyInPlace: profile.equalitiesPolicyInPlace ?? true,
        publicLiabilityInsurance: profile.publicLiabilityInsurance ?? true,
        numberOfTrustees:
          profile.numberOfTrustees !== null ? String(profile.numberOfTrustees) : '',
        trusteesAreUnrelated: profile.trusteesAreUnrelated ?? true,
        hasOutstandingMonitoringReports: profile.hasOutstandingMonitoringReports ?? false,

        volunteerCount: profile.volunteerCount !== null ? String(profile.volunteerCount) : '',
        percentageFreeSchoolMeals:
          profile.percentageFreeSchoolMeals !== null
            ? String(profile.percentageFreeSchoolMeals)
            : '',
        percentageDisabledOrSEND:
          profile.percentageDisabledOrSEND !== null
            ? String(profile.percentageDisabledOrSEND)
            : '',
        specificProjectDescription: profile.specificProjectDescription ?? '',
        estimatedProjectCost: profile.estimatedProjectCost,
        staffOrPaidWorkers: profile.staffOrPaidWorkers ?? false,
      }
    : undefined;

  return (
    <div className="page">
      <header className="page-header">
        <h1>Edit group profile</h1>
        <p className="page-subtitle">
          Update your group details. Changes apply to all future grant searches.
        </p>
      </header>
      <ProfileForm
        initialValues={initialValues}
        onSubmit={handleSubmit}
        submitLabel="Save changes"
      />
    </div>
  );
}
