import { parseEnvironment } from './environment';

describe('environment', () => {
  it('defaults to a loopback listener', () => {
    expect(parseEnvironment({})).toEqual({ PORT: 3000, HOST: '127.0.0.1' });
  });
  it('parses explicit container configuration', () => {
    expect(parseEnvironment({ PORT: '4000', HOST: '0.0.0.0' })).toEqual({ PORT: 4000, HOST: '0.0.0.0' });
  });
  it.each(['', '0', '-1', '65536', '3.5', 'secret-value'])('rejects invalid port %j', (PORT) => {
    expect(() => parseEnvironment({ PORT })).toThrow('Invalid backend environment configuration');
  });
});
