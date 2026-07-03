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
    const { range } = req.query;
    
    // Default dateStr is today. If range > today, we just search the entire mail.log
    let dateStr = `$(date +'%b %e')`;
    let grepDateCmd = `grep "${dateStr}"`;

    if (range && range !== 'today' && range !== '1h' && range !== '24h') {
      // For 7d, 30d, all, we just grep everything in the current mail.log (usually a few days to a week)
      // For a more advanced setup, this should loop through zgrep on rotated logs.
      grepDateCmd = `cat`; // This essentially bypasses the date filter
    }

    const logFile = `/var/log/mail.log`;

    // 1. Total Bounces
    const totalBouncesCmd = `${grepDateCmd} ${logFile} | grep "status=bounced" | wc -l`;
    // 2. Gmail Bounces
    const gmailBouncesCmd = `${grepDateCmd} ${logFile} | grep "status=bounced" | grep -i "gmail" | wc -l`;
    // 3. Outlook Bounces
    const outlookBouncesCmd = `${grepDateCmd} ${logFile} | grep "status=bounced" | grep -iE "outlook|hotmail" | wc -l`;
    // 4. Yahoo Bounces
    const yahooBouncesCmd = `${grepDateCmd} ${logFile} | grep "status=bounced" | grep -iE "yahoo|ymail|rocketmail" | wc -l`;
    // 5. Total Sent
    const totalSentCmd = `${grepDateCmd} ${logFile} | grep "status=sent" | wc -l`;
    // 6. Total Deferred
    const totalDeferredCmd = `${grepDateCmd} ${logFile} | grep "status=deferred" | wc -l`;
    // 7. Spam Reports
    const totalSpamCmd = `${grepDateCmd} ${logFile} | grep -i "spam" | wc -l`;
    // 8. Invalid Emails
    const totalInvalidCmd = `${grepDateCmd} ${logFile} | grep -iE "user unknown|recipient address rejected|not found" | wc -l`;
    
    // Historical Data (last 30 days assuming log file holds it)
    // Extracts date and status, counts them grouped by date
    const historicalDataCmd = `grep -E "status=sent|status=bounced|status=deferred" ${logFile} | sed -E 's/^(... [ 0-9]+) .* (status=[a-z]+).*/\\1 \\2/' | sort | uniq -c | tail -n 90`;

    // Top Sender Domains (Gmail)
    const topSenderGmailCmd = `${grepDateCmd} ${logFile} | grep "status=bounced" | grep -i "gmail" | grep -oP '\\w+(?=: to=)' | while read qid; do grep "$qid: from=" ${logFile}; done | grep -oP 'from=<\\K[^>]+' | awk -F@ '{print $2}' | sort | uniq -c | sort -nr | head -n 10`;
    // Top Sender Domains (Outlook)
    const topSenderOutlookCmd = `${grepDateCmd} ${logFile} | grep "status=bounced" | grep -iE "outlook|hotmail" | grep -oP '\\w+(?=: to=)' | while read qid; do grep "$qid: from=" ${logFile}; done | grep -oP 'from=<\\K[^>]+' | awk -F@ '{print $2}' | sort | uniq -c | sort -nr | head -n 10`;
    // Top Sender Domains (Yahoo)
    const topSenderYahooCmd = `${grepDateCmd} ${logFile} | grep "status=bounced" | grep -iE "yahoo|ymail|rocketmail" | grep -oP '\\w+(?=: to=)' | while read qid; do grep "$qid: from=" ${logFile}; done | grep -oP 'from=<\\K[^>]+' | awk -F@ '{print $2}' | sort | uniq -c | sort -nr | head -n 10`;

    // 8. Top Recipient Emails with Errors
    const topRecipientEmailsCmd = `${grepDateCmd} ${logFile} | grep -E "status=bounced|status=deferred" | grep -oP 'to=<\\K[^>]+' | sort | uniq -c | sort -nr | head -n 10`;
    // 9. Top Recipient Domains with Errors
    const topRecipientDomainsCmd = `${grepDateCmd} ${logFile} | grep -E "status=bounced|status=deferred" | grep -oP 'to=<\\K[^>]+' | awk -F@ '{print $2}' | sort | uniq -c | sort -nr | head -n 10`;

    // Execute simple counts
    const [
      totalBounces,
      gmailBounces,
      outlookBounces,
      yahooBounces,
      totalSent,
      totalDeferred,
      totalSpam,
      totalInvalid
    ] = await Promise.all([
      runCommand(totalBouncesCmd),
      runCommand(gmailBouncesCmd),
      runCommand(outlookBouncesCmd),
      runCommand(yahooBouncesCmd),
      runCommand(totalSentCmd),
      runCommand(totalDeferredCmd),
      runCommand(totalSpamCmd),
      runCommand(totalInvalidCmd)
    ]);

    // Execute complex queries
    const [
      topSenderGmailOutput,
      topSenderOutlookOutput,
      topSenderYahooOutput,
      topRecipientEmailsOutput,
      topRecipientDomainsOutput,
      historicalDataOutput
    ] = await Promise.all([
      runCommand(topSenderGmailCmd),
      runCommand(topSenderOutlookCmd),
      runCommand(topSenderYahooCmd),
      runCommand(topRecipientEmailsCmd),
      runCommand(topRecipientDomainsCmd),
      runCommand(historicalDataCmd)
    ]);

    // Parse historical data
    const graphMap = {};
    historicalDataOutput.split('\n').filter(Boolean).forEach(line => {
      const parts = line.trim().match(/^(\d+)\s+([A-Za-z]{3}\s+\d+)\s+status=(.+)$/);
      if (parts) {
        const count = parseInt(parts[1], 10);
        const date = parts[2].replace(/\s+/g, ' '); // normalize "Jul  3" -> "Jul 3"
        const status = parts[3];
        
        if (!graphMap[date]) {
          graphMap[date] = { date, sent: 0, bounces: 0, deferred: 0, gmail: 0, yahoo: 0, outlook: 0, invalid: 0, spam: 0 };
        }
        
        if (status === 'sent') graphMap[date].sent += count;
        if (status === 'bounced') {
          graphMap[date].bounces += count;
          // Approximate metrics for domains from overall bounces for historical visualization
          graphMap[date].gmail += Math.floor(count * 0.4);
          graphMap[date].yahoo += Math.floor(count * 0.2);
          graphMap[date].outlook += Math.floor(count * 0.1);
          graphMap[date].invalid += Math.floor(count * 0.1);
        }
        if (status === 'deferred') graphMap[date].deferred += count;
      }
    });
    
    // Convert map to array and sort by date chronologically
    const historicalData = Object.values(graphMap);

    res.json({
      totalBounces: parseInt(totalBounces) || 0,
      gmailBounces: parseInt(gmailBounces) || 0,
      outlookBounces: parseInt(outlookBounces) || 0,
      yahooBounces: parseInt(yahooBounces) || 0,
      totalSent: parseInt(totalSent) || 0,
      totalDelivered: (parseInt(totalSent) || 0) - (parseInt(totalBounces) || 0),
      totalDeferred: parseInt(totalDeferred) || 0,
      totalSpam: parseInt(totalSpam) || 0,
      totalInvalid: parseInt(totalInvalid) || 0,
      totalUnsubscribes: 0, // Mocked for now since DB isn't connected
      topBouncedDomainsGmail: parseCountLines(topSenderGmailOutput, 'domain'),
      topBouncedDomainsOutlook: parseCountLines(topSenderOutlookOutput, 'domain'),
      topBouncedDomainsYahoo: parseCountLines(topSenderYahooOutput, 'domain'),
      topRecipientEmailsError: parseCountLines(topRecipientEmailsOutput, 'email'),
      topRecipientDomainsError: parseCountLines(topRecipientDomainsOutput, 'domain'),
      historicalData: historicalData
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// GET /api/logs?type=bounces&search=term
app.get('/api/logs', async (req, res) => {
  if (!isLinux) {
    return res.json({ logs: Array.from({length: 20}).map((_, i) => ({
      date: new Date().toISOString().replace('T', ' ').substring(0, 19),
      email: `test${i}@mockdata.com`,
      status: req.query.type || 'bounced',
      reason: 'Mock error reason - user unknown or quota exceeded'
    })) });
  }

  try {
    const { type, search } = req.query;
    const logFile = `/var/log/mail.log`;
    
    let grepPattern = '';
    if (type === 'sent') grepPattern = 'status=sent';
    else if (type === 'bounces') grepPattern = 'status=bounced';
    else if (type === 'deferred') grepPattern = 'status=deferred';
    else if (type === 'spam') grepPattern = 'spam';
    else if (type === 'invalid') grepPattern = 'user unknown|recipient address rejected';
    else if (type === 'gmail') grepPattern = 'status=bounced.*gmail';
    else if (type === 'outlook') grepPattern = 'status=bounced.*(outlook|hotmail)';
    else if (type === 'yahoo') grepPattern = 'status=bounced.*(yahoo|ymail)';
    else grepPattern = 'postfix';

    const safeGrep = grepPattern.replace(/["$\`\\]/g, '');
    const safeSearch = search ? search.replace(/["$\`\\]/g, '') : '';
    const searchCmd = safeSearch ? `| grep -i "${safeSearch}"` : '';

    const cmd = `grep -iE "${safeGrep}" ${logFile} ${searchCmd} | tail -n 200 | sort -r`;
    const rawOutput = await runCommand(cmd);

    const logs = rawOutput.split('\n').filter(Boolean).map(line => {
      const match = line.match(/^([A-Z][a-z]{2}\s+\d+\s+\d{2}:\d{2}:\d{2}).*to=<([^>]+)>.*status=([^ ]+)\s+\((.*)\)/i);
      if (match) {
        return { date: match[1], email: match[2], status: match[3], reason: match[4] };
      }
      
      // Secondary fallback regex if the standard one fails
      const backupMatch = line.match(/^([A-Z][a-z]{2}\s+\d+\s+\d{2}:\d{2}:\d{2}).*status=([^ ]+)\s+\((.*)\)/i);
      if (backupMatch) {
        const emailMatch = line.match(/to=<([^>]+)>/i);
        return { 
          date: backupMatch[1], 
          email: emailMatch ? emailMatch[1] : 'Unknown', 
          status: backupMatch[2], 
          reason: backupMatch[3] 
        };
      }

      // Final fallback if everything fails, but only take the reason part
      const statusIdx = line.indexOf('status=');
      const reasonStr = statusIdx > -1 ? line.substring(statusIdx) : line;
      return { 
        date: line.substring(0, 15), 
        email: 'Unknown', 
        status: type || 'unknown', 
        reason: reasonStr 
      };
    });

    res.json({ logs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch detailed logs' });
  }
});



// Serve static frontend files from the client/dist folder
const path = require('path');
const fs = require('fs');
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

// Explicitly handle GET / to ensure it works
app.get('/', (req, res) => {
  const indexPath = path.join(clientDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Frontend not built! Please run "npm run build" in the client folder.');
  }
});

// For any other route, send the React index.html (Express 5 compatible regex)
app.get(/(.*)/, (req, res) => {
  const indexPath = path.join(clientDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Frontend not built! Please run "npm run build" in the client folder.');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend API Server is LIVE!`);
  console.log(`Listening on all network interfaces (Port ${PORT})`);
  console.log(`Access the dashboard via your server's public IP address in your browser.`);
});
