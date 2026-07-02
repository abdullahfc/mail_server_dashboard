const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const os = require('os');
const mockData = require('./mockData');

const app = express();
app.use(cors());

const PORT = 3001;

// Determine if we are on Linux (production/live) or not (development)
const isLinux = os.platform() === 'linux';

console.log(`Starting server in ${isLinux ? 'LIVE (Linux)' : 'MOCK (Windows)'} mode...`);

// Helper to run bash command and parse output
const runCommand = (cmd) => {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${cmd}`);
        console.error(error.message);
        return resolve(''); // Return empty string on error to prevent crashing
      }
      resolve(stdout.trim());
    });
  });
};

// Helper to parse "count value" lines into objects
const parseCountLines = (output, valueKey) => {
  if (!output) return [];
  return output.split('\n').filter(Boolean).map(line => {
    const parts = line.trim().split(/\s+/);
    const count = parseInt(parts[0], 10);
    const value = parts[1] || 'unknown';
    return { count, [valueKey]: value };
  });
};

app.get('/api/stats', async (req, res) => {
  if (!isLinux) {
    // Send mock data for local Windows development
    return res.json(mockData);
  }

  try {
    const dateStr = `$(date +'%b %e')`;
    const logFile = `/var/log/mail.log`;

    // 1. Total Bounces
    const totalBouncesCmd = `grep "${dateStr}" ${logFile} | grep "status=bounced" | wc -l`;
    // 2. Gmail Bounces
    const gmailBouncesCmd = `grep "${dateStr}" ${logFile} | grep "status=bounced" | grep -i "gmail" | wc -l`;
    // 3. Outlook Bounces
    const outlookBouncesCmd = `grep "${dateStr}" ${logFile} | grep "status=bounced" | grep -iE "outlook|hotmail" | wc -l`;
    // 4. Total Sent
    const totalSentCmd = `grep "${dateStr}" ${logFile} | grep "status=sent" | wc -l`;
    // 5. Total Deferred
    const totalDeferredCmd = `grep "${dateStr}" ${logFile} | grep "status=deferred" | wc -l`;

    // 6. Top Sender Domains (Gmail)
    const topSenderGmailCmd = `grep "${dateStr}" ${logFile} | grep "status=bounced" | grep -i "gmail" | grep -oP '\\w+(?=: to=)' | while read qid; do grep "$qid: from=" ${logFile}; done | grep -oP 'from=<\\K[^>]+' | awk -F@ '{print $2}' | sort | uniq -c`;
    // 7. Top Sender Domains (Outlook)
    const topSenderOutlookCmd = `grep "${dateStr}" ${logFile} | grep "status=bounced" | grep -iE "outlook|hotmail" | grep -oP '\\w+(?=: to=)' | while read qid; do grep "$qid: from=" ${logFile}; done | grep -oP 'from=<\\K[^>]+' | awk -F@ '{print $2}' | sort | uniq -c`;

    // 8. Top Recipient Emails with Errors
    const topRecipientEmailsCmd = `grep "${dateStr}" ${logFile} | grep -E "status=bounced|status=deferred" | grep -oP 'to=<\\K[^>]+' | sort | uniq -c | sort -nr | head -n 10`;
    // 9. Top Recipient Domains with Errors
    const topRecipientDomainsCmd = `grep "${dateStr}" ${logFile} | grep -E "status=bounced|status=deferred" | grep -oP 'to=<\\K[^>]+' | awk -F@ '{print $2}' | sort | uniq -c | sort -nr | head -n 10`;

    // Execute simple counts
    const [
      totalBounces,
      gmailBounces,
      outlookBounces,
      totalSent,
      totalDeferred
    ] = await Promise.all([
      runCommand(totalBouncesCmd),
      runCommand(gmailBouncesCmd),
      runCommand(outlookBouncesCmd),
      runCommand(totalSentCmd),
      runCommand(totalDeferredCmd)
    ]);

    // Execute complex queries
    const [
      topSenderGmailOutput,
      topSenderOutlookOutput,
      topRecipientEmailsOutput,
      topRecipientDomainsOutput
    ] = await Promise.all([
      runCommand(topSenderGmailCmd),
      runCommand(topSenderOutlookCmd),
      runCommand(topRecipientEmailsCmd),
      runCommand(topRecipientDomainsCmd)
    ]);

    res.json({
      totalBounces: parseInt(totalBounces) || 0,
      gmailBounces: parseInt(gmailBounces) || 0,
      outlookBounces: parseInt(outlookBounces) || 0,
      totalSent: parseInt(totalSent) || 0,
      totalDeferred: parseInt(totalDeferred) || 0,
      topBouncedDomainsGmail: parseCountLines(topSenderGmailOutput, 'domain'),
      topBouncedDomainsOutlook: parseCountLines(topSenderOutlookOutput, 'domain'),
      topRecipientEmailsError: parseCountLines(topRecipientEmailsOutput, 'email'),
      topRecipientDomainsError: parseCountLines(topRecipientDomainsOutput, 'domain'),
      historicalData: [] // Would require parsing older logs, leaving empty for live mode unless requested
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});



// Serve static frontend files from the client/dist folder
const path = require('path');
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

// For any other route, send the React index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
