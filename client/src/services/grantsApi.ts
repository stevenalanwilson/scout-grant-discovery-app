import type { Grant } from '@scout-grants/shared';
import { api } from './api';

export const grantsApi = {
  list(): Promise<Grant[]> {
    return api.get<Grant[]>('/grants');
  },

  get(id: string): Promise<Grant> {
    return api.get<Grant>(`/grants/${id}`);
  },
};
