import type { Grant } from '@scout-grants/shared';
import { api } from './api';

export const shortlistApi = {
  list(): Promise<Grant[]> {
    return api.get<Grant[]>('/shortlist');
  },

  add(grantId: string): Promise<{ message: string }> {
    return api.post<{ message: string }>(`/shortlist/${grantId}`, {});
  },

  remove(grantId: string): Promise<void> {
    return api.delete<void>(`/shortlist/${grantId}`);
  },
};
