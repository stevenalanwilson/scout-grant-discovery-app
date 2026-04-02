import { useState, useEffect, useCallback } from 'react';
import type { Group, CreateGroupInput, UpdateGroupInput } from '@scout-grants/shared';
import { profileApi } from '../services/profileApi';

interface UseProfileResult {
  profile: Group | null;
  isLoading: boolean;
  error: string | null;
  createProfile: (input: CreateGroupInput) => Promise<Group>;
  updateProfile: (input: UpdateGroupInput) => Promise<Group>;
}

export function useProfile(): UseProfileResult {
  const [profile, setProfile] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    profileApi
      .get()
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load profile');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const createProfile = useCallback(async (input: CreateGroupInput): Promise<Group> => {
    const created = await profileApi.create(input);
    setProfile(created);
    return created;
  }, []);

  const updateProfile = useCallback(async (input: UpdateGroupInput): Promise<Group> => {
    const updated = await profileApi.update(input);
    setProfile(updated);
    return updated;
  }, []);

  return { profile, isLoading, error, createProfile, updateProfile };
}
