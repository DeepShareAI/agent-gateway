import { useCallback, useEffect, useRef, useState } from 'react';
import { getHealth } from './api/health';

type Status = 'checking' | 'online' | 'offline';

export function App() {
  const [status, setStatus] = useState<Status>('checking');
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);
  const request = useRef<AbortController | null>(null);

  const checkHealth = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 5000);
    setStatus('checking');
    try {
      await getHealth(controller.signal);
      if (request.current === controller) setStatus('online');
    } catch {
      if (request.current === controller) setStatus('offline');
    } finally {
      window.clearTimeout(timeout);
      if (request.current === controller) setCheckedAt(new Date());
    }
  }, []);

  useEffect(() => {
    void checkHealth();
    return () => {
      request.current?.abort();
      request.current = null;
    };
  }, [checkHealth]);

  return (
    <div className="shell">
      <header className="masthead">
        <a className="brand" href="/" aria-label="Agent Gateway home">
          <span className="brand-icon" aria-hidden="true">AG</span>
          <span>Agent Gateway</span>
        </a>
        <span className="environment">Local workspace</span>
      </header>
      <main>
        <p className="eyebrow">YOUR PERSONAL GATEWAY</p>
        <h1>Gateway Dashboard</h1>
        <p className="intro">A home for controlled access to your private data.</p>
        <section className="status-card" aria-labelledby="backend-title">
          <div className="card-heading">
            <div>
              <p className="eyebrow">CONNECTION</p>
              <h2 id="backend-title">Backend status</h2>
            </div>
            <div role="status" className={`badge ${status}`}>
              <span className="status-dot" aria-hidden="true" />
              {status === 'checking' ? 'Checking…' : status === 'online' ? 'Online' : 'Unavailable'}
            </div>
          </div>
          <p className="status-description">
            {status === 'online'
              ? 'Your gateway is responding and ready for the next step.'
              : status === 'offline'
                ? 'We could not reach your gateway. Check that the backend is running, then try again.'
                : 'Connecting to your gateway…'}
          </p>
          <div className="card-footer">
            <span>{checkedAt ? `Last checked ${checkedAt.toLocaleTimeString()}` : 'Checking connection'}</span>
            <button type="button" onClick={() => void checkHealth()} disabled={status === 'checking'}>
              {status === 'checking' ? 'Checking…' : 'Check again'}
            </button>
          </div>
        </section>
        <section className="welcome" aria-labelledby="welcome-title">
          <span className="welcome-icon" aria-hidden="true">↗</span>
          <div>
            <h2 id="welcome-title">Your gateway starts here.</h2>
            <p>Agent connections, data sources, and access approvals are coming in future milestones. No private data sources are connected yet.</p>
          </div>
        </section>
      </main>
      <footer>Agent Gateway <span>Foundation · v0.1</span></footer>
    </div>
  );
}
