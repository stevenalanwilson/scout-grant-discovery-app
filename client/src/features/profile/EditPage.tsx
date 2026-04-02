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
      }
    : undefined;

  return (
    <div className="page">
      <header className="page-header">
        <h1>Edit group profile</h1>
        <p className="page-subtitle">Update your group details. Changes apply to all future grant searches.</p>
      </header>
      <ProfileForm
        initialValues={initialValues}
        onSubmit={handleSubmit}
        submitLabel="Save changes"
      />
    </div>
  );
}
