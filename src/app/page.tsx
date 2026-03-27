export default function Home() {
  return (
    <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🎯 CLV — Freebie Hunter</h1>
      <p style={{ marginTop: '1rem', color: '#aaa' }}>
        Personal AI agent để săn freebies, trials & promos.
      </p>
      <ul
        style={{
          marginTop: '2rem',
          listStyle: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        <li style={{ color: '#60a5fa' }}>GET /api/freebies — Danh sách freebies</li>
        <li>
          <code style={{ color: '#34d399' }}>POST /api/ingest — Trigger ingestion thủ công</code>
        </li>
        <li>
          <code style={{ color: '#34d399' }}>POST /api/analyze — Trigger analyzer thủ công</code>
        </li>
      </ul>
      <p style={{ marginTop: '3rem', color: '#555', fontSize: '0.875rem' }}>
        Dashboard UI → Phase 6
      </p>
    </main>
  );
}
