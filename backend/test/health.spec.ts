import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Day 1 API', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    await app.listen(0, '127.0.0.1');
  });
  afterAll(async () => { await app.close(); });

  it('exposes a public liveness response without environment or credential data', async () => {
    await request(app.getHttpServer()).get('/health')
      .expect(200).expect('Cache-Control', 'no-store')
      .expect({ status: 'ok', service: 'agent-gateway' });
  });

  it('rejects unexpected query parameters without echoing input', async () => {
    await request(app.getHttpServer()).get('/health?token=private-value').expect(400)
      .expect({ statusCode: 400, message: 'Request validation failed', error: 'Bad Request' });
  });

  it.each(['/agents', '/access-requests', '/datasources', '/mcp'])('does not expose unimplemented private route %s', async (path) => {
    await request(app.getHttpServer()).get(path).expect(404);
  });

  it('does not allow health mutations', async () => {
    await request(app.getHttpServer()).post('/health').send({ status: 'override' }).expect(404);
  });
});
