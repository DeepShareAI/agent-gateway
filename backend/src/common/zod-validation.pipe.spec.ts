import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from './zod-validation.pipe';

describe('ZodValidationPipe', () => {
  const pipe = new ZodValidationPipe(z.strictObject({ limit: z.coerce.number().int().min(1).max(100) }));

  it('returns the parsed value for downstream handlers', () => {
    expect(pipe.transform({ limit: '10' })).toEqual({ limit: 10 });
  });

  it.each([null, {}, { limit: 0 }, { limit: 101 }, { limit: 1.5 }, { limit: 'invalid' }, { limit: 1, secret: 'private-value' }])(
    'rejects malformed, out-of-range, and unknown input: %j', (input) => {
      expect(() => pipe.transform(input)).toThrow(BadRequestException);
    },
  );

  it('does not echo private values or field names in errors', () => {
    try {
      pipe.transform({ 'private-value': 'secret' });
      throw new Error('Expected validation failure');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).getResponse()).toEqual({
        statusCode: 400, error: 'Bad Request', message: 'Request validation failed',
      });
    }
  });
});
