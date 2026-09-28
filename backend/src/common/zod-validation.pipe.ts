import { BadRequestException, PipeTransform } from '@nestjs/common';
import { z } from 'zod';

export class ZodValidationPipe<T extends z.ZodType> implements PipeTransform<unknown, z.output<T>> {
  constructor(private readonly schema: T) {}

  transform(value: unknown): z.output<T> {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      // Zod issues may include user-provided values or field names. Keep errors generic.
      throw new BadRequestException('Request validation failed');
    }
    return result.data;
  }
}
