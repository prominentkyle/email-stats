import { useState, useRef } from 'react';

interface UploadModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function UploadModal({ onClose, onSuccess }: UploadModalProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('Please select a valid CSV file');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const fileContent = event.target?.result as string;

          // Convert string to base64 using browser API
          const base64File = btoa(unescape(encodeURIComponent(fileContent)));

          const response = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              file: base64File,
              filename: file.name,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            setError(data.details || data.error || 'Upload failed');
            setUploading(false);
            return;
          }

          setSuccess(
            `✅ Successfully processed ${data.insertedCount} records from ${file.name}`
          );

          setTimeout(() => {
            setUploading(false);
            onSuccess();
          }, 1500);
        } catch (err) {
          setError('Failed to process file');
          setUploading(false);
          console.error(err);
        }
      };

      reader.onerror = () => {
        setError('Failed to read file');
        setUploading(false);
      };

      reader.readAsText(file);
    } catch (err) {
      setError('Failed to upload file');
      setUploading(false);
      console.error(err);
    }
  };

  const backdropStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };

  const modalStyle: React.CSSProperties = {
    backgroundColor: 'var(--card)',
    borderRadius: 'var(--radius-md)',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    padding: 'var(--sp-32)',
    maxWidth: '500px',
    width: '90%',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: 'var(--sp-16)',
    backgroundColor: 'var(--bg)',
    border: `2px dashed var(--border)`,
    borderRadius: 'var(--radius-md)',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 200ms ease',
  };

  return (
    <div style={backdropStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h2
          style={{
            fontSize: 'var(--text-xl)',
            fontWeight: 600,
            marginBottom: 'var(--sp-24)',
            color: 'var(--text)',
          }}
        >
          Import Email Statistics
        </h2>

        <label style={{ display: 'block', marginBottom: 'var(--sp-24)' }}>
          <div
            style={inputStyle}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <div style={{ fontSize: '32px', marginBottom: 'var(--sp-12)' }}>📁</div>
            <p
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                color: 'var(--text)',
                marginBottom: 'var(--sp-4)',
              }}
            >
              {uploading ? 'Uploading...' : 'Drop CSV file or click to select'}
            </p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              Google Workspace daily usage statistics
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </label>

        {error && (
          <div
            style={{
              padding: 'var(--sp-12)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: `1px solid #EF4444`,
              borderRadius: 'var(--radius-sm)',
              color: '#DC2626',
              fontSize: 'var(--text-sm)',
              marginBottom: 'var(--sp-16)',
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              padding: 'var(--sp-12)',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: `1px solid #10B981`,
              borderRadius: 'var(--radius-sm)',
              color: '#059669',
              fontSize: 'var(--text-sm)',
            }}
          >
            {success}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            gap: 'var(--sp-12)',
            marginTop: 'var(--sp-24)',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '10px 16px',
              backgroundColor: 'var(--border)',
              color: 'var(--text)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 200ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#D1D5DB')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--border)')}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
