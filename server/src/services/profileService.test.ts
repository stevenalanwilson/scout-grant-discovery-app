import { describe, it, expect, vi, beforeEach } from 'vitest';
import { profileService, validateCharityNumberFormat } from './profileService';
import { groupRepository } from '../repositories/groupRepository';

vi.mock('../repositories/groupRepository');
vi.mock('./postcodeService', () => ({
  lookupPostcode: vi.fn().mockResolvedValue({ region: null, deprivationFlag: null, ruralFlag: null }),
}));

const mockGroup = {
  id: 'cltest123',
  name: '1st Anywhere Scout Group',
  membershipNumber: '40001234',
  charityNumber: '1234567',
  postcode: 'DE1 1AA',
  region: 'East Midlands',
  sections: ['CUBS', 'SCOUTS'],
  membershipCount: 40,
  fundingPurposes: ['EQUIPMENT', 'ACTIVITIES'],
  additionalContext: null,
  deprivationFlag: null,
  deprivationOverride: null,
  deprivationOverrideReason: null,
  ruralFlag: null,
  ruralOverride: null,
  ruralOverrideReason: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

const createInput = {
  name: '1st Anywhere Scout Group',
  membershipNumber: '40001234',
  charityNumber: '1234567',
  postcode: 'DE1 1AA',
  sections: ['CUBS', 'SCOUTS'] as const,
  membershipCount: 40,
  fundingPurposes: ['EQUIPMENT', 'ACTIVITIES'] as const,
  additionalContext: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('validateCharityNumberFormat', () => {
  it('accepts a valid England & Wales number', () => {
    const result = validateCharityNumberFormat('1234567');
    expect(result.valid).toBe(true);
    expect(result.jurisdiction).toBe('england-wales');
    expect(result.message).toBeNull();
  });

  it('accepts a valid Scottish charity number', () => {
    const result = validateCharityNumberFormat('SC000088');
    expect(result.valid).toBe(true);
    expect(result.jurisdiction).toBe('scotland');
    expect(result.message).not.toBeNull();
  });

  it('accepts a valid Northern Irish charity number', () => {
    const result = validateCharityNumberFormat('NI100001');
    expect(result.valid).toBe(true);
    expect(result.jurisdiction).toBe('northern-ireland');
  });

  it('rejects an invalid format', () => {
    const result = validateCharityNumberFormat('INVALID');
    expect(result.valid).toBe(false);
    expect(result.jurisdiction).toBe('unknown');
    expect(result.message).not.toBeNull();
  });
});

describe('profileService.getProfile', () => {
  it('returns null when no group exists', async () => {
    vi.mocked(groupRepository.findFirst).mockResolvedValue(null);
    const result = await profileService.getProfile();
    expect(result).toBeNull();
  });

  it('returns a mapped group when one exists', async () => {
    vi.mocked(groupRepository.findFirst).mockResolvedValue(mockGroup);
    const result = await profileService.getProfile();
    expect(result).not.toBeNull();
    expect(result?.id).toBe('cltest123');
    expect(result?.createdAt).toBe('2026-01-01T00:00:00.000Z');
  });
});

describe('profileService.createProfile', () => {
  it('throws 409 if a profile already exists', async () => {
    vi.mocked(groupRepository.findFirst).mockResolvedValue(mockGroup);

    await expect(profileService.createProfile(createInput)).rejects.toMatchObject({
      status: 409,
    });
  });

  it('creates and returns a mapped group', async () => {
    vi.mocked(groupRepository.findFirst).mockResolvedValue(null);
    vi.mocked(groupRepository.create).mockResolvedValue(mockGroup);

    const result = await profileService.createProfile(createInput);
    expect(groupRepository.create).toHaveBeenCalledOnce();
    expect(result.name).toBe('1st Anywhere Scout Group');
  });

  it('uppercases the postcode', async () => {
    vi.mocked(groupRepository.findFirst).mockResolvedValue(null);
    vi.mocked(groupRepository.create).mockResolvedValue(mockGroup);

    await profileService.createProfile({ ...createInput, postcode: 'de1 1aa' });
    expect(groupRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ postcode: 'DE1 1AA' }),
    );
  });
});

describe('profileService.updateProfile', () => {
  it('throws 404 if no profile exists', async () => {
    vi.mocked(groupRepository.findFirst).mockResolvedValue(null);

    await expect(profileService.updateProfile({ name: 'New Name' })).rejects.toMatchObject({
      status: 404,
    });
  });

  it('updates and returns the mapped group', async () => {
    vi.mocked(groupRepository.findFirst).mockResolvedValue(mockGroup);
    vi.mocked(groupRepository.update).mockResolvedValue({ ...mockGroup, name: 'New Name' });

    const result = await profileService.updateProfile({ name: 'New Name' });
    expect(result.name).toBe('New Name');
    expect(groupRepository.update).toHaveBeenCalledWith(
      'cltest123',
      expect.objectContaining({ name: 'New Name' }),
    );
  });
});
