import fs from 'fs';

export interface UserDailyStats {
  email: string;
  totalEmails: number;
  emailsSent: number;
  emailsReceived: number;
  filesEdited: number;
  filesViewed: number;
  gmailImapLastUsed: string;
  gmailWebLastUsed: string;
  date: string;
}

function parseCSVLine(line: string): string[] {
  const result = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

export function parseCSVFile(filePath: string): UserDailyStats[] {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const lines = fileContent.split('\n').filter(line => line.trim());

  if (lines.length < 2) {
    return [];
  }

  // Parse header
  const headerLine = parseCSVLine(lines[0]);

  // Create header map to handle dynamic column positions
  const headerMap: { [key: string]: number } = {};
  let dateStr = '';

  for (let i = 0; i < headerLine.length; i++) {
    const header = headerLine[i].toLowerCase();

    // Extract date from any header that has it
    if (!dateStr) {
      const dateMatch = headerLine[i].match(/\[(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        dateStr = dateMatch[1];
      }
    }

    // Map column names to indices
    if (header.includes('user')) {
      headerMap['email'] = i;
    } else if (header.includes('total emails')) {
      headerMap['totalEmails'] = i;
    } else if (header.includes('emails sent')) {
      headerMap['emailsSent'] = i;
    } else if (header.includes('emails received')) {
      headerMap['emailsReceived'] = i;
    } else if (header.includes('files edited')) {
      headerMap['filesEdited'] = i;
    } else if (header.includes('files viewed')) {
      headerMap['filesViewed'] = i;
    } else if (header.includes('gmail (imap)')) {
      headerMap['gmailImapLastUsed'] = i;
    } else if (header.includes('gmail (web)')) {
      headerMap['gmailWebLastUsed'] = i;
    }
  }

  // Fallback: if no date found in headers, extract from filename
  if (!dateStr) {
    const fileName = filePath.split('/').pop() || '';
    const match = fileName.match(/users_logs_(\d+)/);
    if (match) {
      const timestamp = parseInt(match[1]);
      dateStr = new Date(timestamp).toISOString().split('T')[0];
    } else {
      dateStr = new Date().toISOString().split('T')[0];
    }
  }

  console.log('CSV Parser - Headers found:', headerMap, 'Date:', dateStr);

  // Parse data rows
  const results: UserDailyStats[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);

    const email = values[headerMap['email']]?.trim() || '';
    if (!email) continue;

    results.push({
      email,
      totalEmails: parseInt(values[headerMap['totalEmails']] || '0') || 0,
      emailsSent: parseInt(values[headerMap['emailsSent']] || '0') || 0,
      emailsReceived: parseInt(values[headerMap['emailsReceived']] || '0') || 0,
      filesEdited: parseInt(values[headerMap['filesEdited']] || '0') || 0,
      filesViewed: parseInt(values[headerMap['filesViewed']] || '0') || 0,
      gmailImapLastUsed: values[headerMap['gmailImapLastUsed']]?.trim() || 'Not in last 30 days',
      gmailWebLastUsed: values[headerMap['gmailWebLastUsed']]?.trim() || 'Not in last 30 days',
      date: dateStr,
    });
  }

  console.log(`CSV Parser - Parsed ${results.length} records from ${filePath}`);
  return results;
}

export function extractDateFromCSV(content: string): string {
  const lines = content.split('\n');
  const headerLine = lines[0];
  const dateMatch = headerLine.match(/\[(\d{4}-\d{2}-\d{2})/);
  if (dateMatch) {
    return dateMatch[1];
  }
  return new Date().toISOString().split('T')[0];
}
