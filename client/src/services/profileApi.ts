import type { Group, CreateGroupInput, UpdateGroupInput } from '@scout-grants/shared';
import { api, ApiError } from './api';

export const profileApi = {
  async get(): Promise<Group | null> {
    try {
      return await api.get<Group>('/profile');
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return null;
      throw err;
    }
  },

  create(input: CreateGroupInput): Promise<Group> {
    return api.post<Group>('/profile', input);
  },

  update(input: UpdateGroupInput): Promise<Group> {
    return api.put<Group>('/profile', input);
  },
};
