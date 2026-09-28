import { z } from 'zod';

const healthSchema = z.strictObject({
  status: z.literal('ok'),
  service: z.literal('agent-gateway'),
});
export type Health = z.infer<typeof healthSchema>;

export async function getHealth(signal: AbortSignal): Promise<Health> {
  const response = await fetch('/api/health', { signal, cache: 'no-store' });
  if (!response.ok) throw new Error('Backend unavailable');
  return healthSchema.parse(await response.json());
}
