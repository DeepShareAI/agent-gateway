import { Controller, Get, Header, Query } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/zod-validation.pipe';

const healthQuerySchema = z.strictObject({});
type HealthQuery = z.infer<typeof healthQuerySchema>;

@Controller('health')
export class HealthController {
  @Get()
  @Header('Cache-Control', 'no-store')
  getHealth(@Query(new ZodValidationPipe(healthQuerySchema)) query: HealthQuery) {
    void query;
    return { status: 'ok', service: 'agent-gateway' };
  }
}
