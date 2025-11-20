interface FilterPanelProps {
  startDate: string;
  endDate: string;
  emailFilter: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onEmailFilterChange: (email: string) => void;
}

export default function FilterPanel({
  startDate,
  endDate,
  emailFilter,
  onStartDateChange,
  onEndDateChange,
  onEmailFilterChange,
}: FilterPanelProps) {
  const inputStyle: React.CSSProperties = {
    padding: '10px 12px',
    backgroundColor: 'var(--card)',
    border: `1px solid var(--border)`,
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--text-sm)',
    color: 'var(--text)',
    transition: 'all 200ms ease',
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 'var(--sp-12)',
        marginBottom: 'var(--sp-24)',
        alignItems: 'flex-end',
      }}
    >
      <div>
        <label
          style={{
            display: 'block',
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: 'var(--sp-8)',
            letterSpacing: '0.5px',
          }}
        >
          Start Date
        </label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          style={inputStyle}
        />
      </div>

      <div>
        <label
          style={{
            display: 'block',
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: 'var(--sp-8)',
            letterSpacing: '0.5px',
          }}
        >
          End Date
        </label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          style={inputStyle}
        />
      </div>

      <div>
        <label
          style={{
            display: 'block',
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: 'var(--sp-8)',
            letterSpacing: '0.5px',
          }}
        >
          Search Email
        </label>
        <input
          type="text"
          value={emailFilter}
          onChange={(e) => onEmailFilterChange(e.target.value)}
          placeholder="e.g., kyle@..."
          style={inputStyle}
        />
      </div>
    </div>
  );
}
