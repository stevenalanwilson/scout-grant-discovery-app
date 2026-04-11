import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import SetupPage from './SetupPage';
import * as useProfileModule from '../../hooks/useProfile';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importActual) => {
  const actual = await importActual<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockCreateProfile = vi.fn();

function mockUseProfile(overrides = {}): void {
  vi.spyOn(useProfileModule, 'useProfile').mockReturnValue({
    profile: null,
    isLoading: false,
    error: null,
    createProfile: mockCreateProfile,
    updateProfile: vi.fn(),
    ...overrides,
  });
}

function renderSetup(): ReturnType<typeof render> {
  return render(
    <MemoryRouter>
      <SetupPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseProfile();
});

describe('SetupPage', () => {
  it('renders the setup heading', () => {
    renderSetup();
    expect(screen.getByRole('heading', { name: /set up your group profile/i })).toBeInTheDocument();
  });

  it('renders required form fields on tab 1', () => {
    renderSetup();
    expect(screen.getByLabelText(/group name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/membership number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/postcode/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/membership count/i)).toBeInTheDocument();
  });

  it('shows validation errors when submitting an empty form', async () => {
    const user = userEvent.setup();
    renderSetup();

    // Navigate to the last tab to access the submit button
    await user.click(screen.getByRole('tab', { name: /funding request/i }));
    await user.click(screen.getByRole('button', { name: /save and find grants/i }));

    // After failed validation, form navigates to first tab with errors (tab 0)
    expect(await screen.findByText(/group name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/membership number is required/i)).toBeInTheDocument();
    expect(screen.getByText(/postcode is required/i)).toBeInTheDocument();
    expect(screen.getByText(/select at least one section/i)).toBeInTheDocument();
    expect(mockCreateProfile).not.toHaveBeenCalled();
  });

  it('calls createProfile and navigates on valid submission', async () => {
    const user = userEvent.setup();
    mockCreateProfile.mockResolvedValue({});
    renderSetup();

    // Fill tab 0 fields
    await user.type(screen.getByLabelText(/group name/i), '1st Anywhere Scouts');
    await user.type(screen.getByLabelText(/membership number/i), '40001234');
    await user.type(screen.getByLabelText(/postcode/i), 'DE1 1AA');
    await user.type(screen.getByLabelText(/membership count/i), '30');
    await user.click(screen.getByLabelText(/scouts \(10/i));

    // Navigate to tab 5 (Funding request) to fill fundingPurposes and submit
    await user.click(screen.getByRole('tab', { name: /funding request/i }));
    await user.click(screen.getByLabelText(/equipment/i));
    await user.click(screen.getByRole('button', { name: /save and find grants/i }));

    await waitFor(() => {
      expect(mockCreateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          name: '1st Anywhere Scouts',
          membershipNumber: '40001234',
          postcode: 'DE1 1AA',
          membershipCount: 30,
          sections: ['SCOUTS'],
          fundingPurposes: ['EQUIPMENT'],
        }),
      );
    });

    expect(mockNavigate).toHaveBeenCalledWith('/grants');
  });

  it('shows a submit error when createProfile rejects', async () => {
    const user = userEvent.setup();
    mockCreateProfile.mockRejectedValue(new Error('Server error'));
    renderSetup();

    // Fill required fields
    await user.type(screen.getByLabelText(/group name/i), '1st Test Scouts');
    await user.type(screen.getByLabelText(/membership number/i), '40001234');
    await user.type(screen.getByLabelText(/postcode/i), 'DE1 1AA');
    await user.type(screen.getByLabelText(/membership count/i), '30');
    await user.click(screen.getByLabelText(/scouts \(10/i));

    // Navigate to funding request tab, fill required field, then submit
    await user.click(screen.getByRole('tab', { name: /funding request/i }));
    await user.click(screen.getByLabelText(/equipment/i));
    await user.click(screen.getByRole('button', { name: /save and find grants/i }));

    expect(await screen.findByText(/server error/i)).toBeInTheDocument();
  });
});
