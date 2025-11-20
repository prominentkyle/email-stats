import { useState, useRef } from 'react';

interface UploadSectionProps {
  onUploadSuccess: () => void;
}

export default function UploadSection({ onUploadSuccess }: UploadSectionProps) {
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
        const fileContent = event.target?.result as string;
        const base64File = Buffer.from(fileContent).toString('base64');

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
          setError(data.error || 'Upload failed');
          return;
        }

        setSuccess(
          `✅ Successfully processed ${data.insertedCount} records from ${file.name}`
        );
        onUploadSuccess();

        // Reset input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };

      reader.readAsText(file);
    } catch (err) {
      setError('Failed to upload file');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 mb-8 border border-white/20">
      <h2 className="text-2xl font-bold text-white mb-6">📤 Import CSV Data</h2>

      <div className="flex items-center justify-center">
        <label className="w-full">
          <div className="border-2 border-dashed border-purple-300 rounded-lg p-12 text-center cursor-pointer hover:border-purple-400 hover:bg-white/5 transition-all">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-purple-300"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20a4 4 0 004 4h24a4 4 0 004-4V20m-10-8h8m-4 4v12m-6-6l6 6 6-6"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="text-white text-lg font-semibold mb-2">
              {uploading ? 'Uploading...' : 'Drop CSV files here or click to select'}
            </p>
            <p className="text-purple-200 text-sm">
              Each CSV should contain daily email usage statistics
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-200">
          {success}
        </div>
      )}
    </div>
  );
}
