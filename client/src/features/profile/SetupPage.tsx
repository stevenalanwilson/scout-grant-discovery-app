import { useNavigate } from 'react-router-dom';
import type { CreateGroupInput } from '@scout-grants/shared';
import { useProfile } from '../../hooks/useProfile';
import { ProfileForm } from './components/ProfileForm';

export default function SetupPage(): React.ReactElement {
  const { createProfile } = useProfile();
  const navigate = useNavigate();

  async function handleSubmit(input: CreateGroupInput): Promise<void> {
    await createProfile(input);
    navigate('/grants');
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Set up your group profile</h1>
        <p className="page-subtitle">
          Tell us about your Scout group so we can find the right grants for you.
        </p>
      </header>
      <ProfileForm onSubmit={handleSubmit} submitLabel="Save and find grants" />
    </div>
  );
}
