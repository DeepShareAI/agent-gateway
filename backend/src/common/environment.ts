import { z } from 'zod';

const environmentSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  HOST: z.enum(['127.0.0.1', '0.0.0.0']).default('127.0.0.1'),
});

export type Environment = z.infer<typeof environmentSchema>;

export function parseEnvironment(input: Record<string, string | undefined>): Environment {
  const result = environmentSchema.safeParse(input);
  if (!result.success) throw new Error('Invalid backend environment configuration');
  return result.data;
}
