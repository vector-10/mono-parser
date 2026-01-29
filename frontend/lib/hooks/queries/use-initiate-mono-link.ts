import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

export function useInitiateMonoLink() {
  return useMutation({
    mutationFn: async (applicantId: string) => {
      const response = await api.post(`/mono/initiate/${applicantId}`);
      return response.data as { widgetUrl: string };
    },
  });
}