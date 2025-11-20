import { useRef } from 'react';

interface HeaderProps {
  onImportClick: () => void;
}

export default function Header({ onImportClick }: HeaderProps) {
  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 'var(--sp-32)',
      }}
    >
      <div>
        <h1
          style={{
            fontSize: 'var(--text-2xl)',
            fontWeight: 600,
            marginBottom: 'var(--sp-8)',
            color: 'var(--text)',
          }}
        >
          Email Usage
        </h1>
        <p
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-muted)',
          }}
        >
          Last 30 days • Company-wide
        </p>
      </div>

      <button
        onClick={onImportClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--sp-8)',
          padding: 'var(--sp-12) var(--sp-16)',
          backgroundColor: 'var(--accent)',
          color: 'white',
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          fontSize: 'var(--text-sm)',
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: 'var(--shadow-xs)',
          transition: 'opacity 200ms ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
      >
        <span>📥</span> Import CSV
      </button>
    </header>
  );
}
