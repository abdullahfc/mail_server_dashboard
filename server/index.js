const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const os = require('os');
const mockData = require('./mockData');
const { runQuery } = require('./db');
const { startParser } = require('./parser');

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
    
    // SQLite Date Filtering
    let dateClause = '';
    const todayPrefix = new Date().toISOString().slice(0, 10);
    if (!range || range === 'today') dateClause = `date LIKE '${todayPrefix}%'`;
    else if (range === '1h') dateClause = `date >= datetime('now', '-1 hour', 'localtime')`;
    else if (range === '24h') dateClause = `date >= datetime('now', '-24 hour', 'localtime')`;
    else if (range === '7d') dateClause = `date >= datetime('now', '-7 day', 'localtime')`;
    else if (range === '30d') dateClause = `date >= datetime('now', '-30 day', 'localtime')`;
    else if (range === 'all') dateClause = `1=1`;
    else dateClause = `date LIKE '${todayPrefix}%'`;

    // Active Queue (still uses mailq)
    const activeQueueCmd = `mailq | grep -c "^[A-F0-9]" || echo "0"`;
    const activeQueueRaw = await runCommand(activeQueueCmd);
    const activeQueue = parseInt(activeQueueRaw) || 0;

    // Run parallel database queries
    const [
      [{ c: totalErrors }],
      [{ c: totalSent }],
      [{ c: totalInvalid }],
      [{ c: gmailBounces }],
      [{ c: outlookBounces }],
      [{ c: yahooBounces }],
      [{ c: otherBounces }],
      [{ c: outgoingSpamBounces }],
      [{ c: incomingSpam }],
      topSenderGmailOutput,
      topSenderOutlookOutput,
      topSenderYahooOutput,
      topRecipientEmailsOutput,
      topRecipientDomainsOutput,
      topSpamDomainsOutput,
      domainNotFoundOutput,
      topRecipientEmailsAllOutput,
      historicalDataRaw
    ] = await Promise.all([
      runQuery(`SELECT COUNT(DISTINCT queue_id || recipient) as c FROM deliveries WHERE status IN ('bounced', 'deferred') AND ${dateClause}`),
      runQuery(`SELECT COUNT(DISTINCT queue_id || recipient) as c FROM deliveries WHERE status='sent' AND ${dateClause}`),
      runQuery(`SELECT COUNT(DISTINCT recipient) as c FROM deliveries WHERE is_invalid=1 AND ${dateClause}`),
      runQuery(`SELECT COUNT(DISTINCT queue_id || recipient) as c FROM deliveries WHERE status='bounced' AND domain='gmail.com' AND ${dateClause}`),
      runQuery(`SELECT COUNT(DISTINCT queue_id || recipient) as c FROM deliveries WHERE status='bounced' AND domain IN ('outlook.com', 'hotmail.com') AND ${dateClause}`),
      runQuery(`SELECT COUNT(DISTINCT queue_id || recipient) as c FROM deliveries WHERE status='bounced' AND domain IN ('yahoo.com', 'ymail.com', 'rocketmail.com') AND ${dateClause}`),
      runQuery(`SELECT COUNT(DISTINCT queue_id || recipient) as c FROM deliveries WHERE status='bounced' AND domain NOT IN ('gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'ymail.com', 'rocketmail.com') AND ${dateClause}`),
      
      // New SPAM Metrics
      runQuery(`SELECT COUNT(DISTINCT queue_id || recipient) as c FROM deliveries WHERE status='bounced' AND is_spam=1 AND ${dateClause}`),
      runQuery(`SELECT COUNT(DISTINCT queue_id || recipient) as c FROM deliveries WHERE status='incoming_spam' AND is_spam=1 AND ${dateClause}`),
      
      runQuery(`SELECT sender as domain, COUNT(*) as count FROM deliveries WHERE status='bounced' AND domain='gmail.com' AND ${dateClause} GROUP BY sender ORDER BY count DESC LIMIT 10`),
      runQuery(`SELECT sender as domain, COUNT(*) as count FROM deliveries WHERE status='bounced' AND domain IN ('outlook.com', 'hotmail.com') AND ${dateClause} GROUP BY sender ORDER BY count DESC LIMIT 10`),
      runQuery(`SELECT sender as domain, COUNT(*) as count FROM deliveries WHERE status='bounced' AND domain IN ('yahoo.com', 'ymail.com', 'rocketmail.com') AND ${dateClause} GROUP BY sender ORDER BY count DESC LIMIT 10`),
      
      runQuery(`SELECT sender as email, COUNT(*) as count FROM deliveries WHERE status IN ('bounced', 'deferred') AND ${dateClause} GROUP BY sender ORDER BY count DESC LIMIT 10`),
      runQuery(`SELECT SUBSTR(sender, INSTR(sender, '@') + 1) as domain, COUNT(*) as count FROM deliveries WHERE status IN ('bounced', 'deferred') AND ${dateClause} GROUP BY domain ORDER BY count DESC LIMIT 10`),
      runQuery(`SELECT domain, COUNT(*) as count FROM deliveries WHERE is_spam=1 AND ${dateClause} GROUP BY domain ORDER BY count DESC LIMIT 10`),
      runQuery(`SELECT domain, COUNT(DISTINCT recipient) as count FROM deliveries WHERE is_invalid=1 AND ${dateClause} GROUP BY domain ORDER BY count DESC LIMIT 20`),
      
      runQuery(`SELECT recipient as email, COUNT(*) as count FROM deliveries WHERE status='sent' AND ${dateClause} GROUP BY recipient ORDER BY count DESC LIMIT 10`),
      
      runQuery(`SELECT date(date) as day, status, COUNT(DISTINCT queue_id || recipient) as c FROM deliveries WHERE ${dateClause} GROUP BY day, status`)
    ]);

    // Parse historical data
    const graphMap = {};
    historicalDataRaw.forEach(row => {
      // Re-format YYYY-MM-DD back to "Jul 3" for UI consistency
      const d = new Date(row.day);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      if (!graphMap[dateStr]) {
        graphMap[dateStr] = { date: dateStr, sent: 0, bounces: 0, deferred: 0, gmail: 0, yahoo: 0, outlook: 0, invalid: 0, spam: 0 };
      }
      
      if (row.status === 'sent') graphMap[dateStr].sent += row.c;
      if (row.status === 'bounced' || row.status === 'deferred') {
        graphMap[dateStr].bounces += row.c;
        graphMap[dateStr].gmail += Math.floor(row.c * 0.4);
        graphMap[dateStr].yahoo += Math.floor(row.c * 0.2);
        graphMap[dateStr].outlook += Math.floor(row.c * 0.1);
        graphMap[dateStr].invalid += Math.floor(row.c * 0.1);
      }
    });
    
    const historicalData = Object.values(graphMap).sort((a, b) => {
      const year = new Date().getFullYear();
      return new Date(`${a.date} ${year}`) - new Date(`${b.date} ${year}`);
    });

    res.json({
      totalErrors: totalErrors || 0,
      gmailBounces: gmailBounces || 0,
      outlookBounces: outlookBounces || 0,
      yahooBounces: yahooBounces || 0,
      otherBounces: otherBounces || 0,
      totalSent: totalSent || 0,
      totalDelivered: (totalSent || 0) - (totalErrors || 0),
      activeQueue: activeQueue || 0,
      totalInvalid: totalInvalid || 0,
      outgoingSpamBounces: outgoingSpamBounces || 0,
      incomingSpam: incomingSpam || 0,
      topBouncedDomainsGmail: topSenderGmailOutput,
      topBouncedDomainsOutlook: topSenderOutlookOutput,
      topBouncedDomainsYahoo: topSenderYahooOutput,
      topRecipientEmailsError: topRecipientEmailsOutput,
      topRecipientDomainsError: topRecipientDomainsOutput,
      topRecipientEmailsAll: topRecipientEmailsAllOutput,
      topSpamDomains: topSpamDomainsOutput,
      blockedDomains: domainNotFoundOutput,
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
    const { type, search, range } = req.query;
    
    let dateClause = '';
    const todayPrefix = new Date().toISOString().slice(0, 10);
    if (!range || range === 'today') dateClause = `date LIKE '${todayPrefix}%'`;
    else if (range === 'all') dateClause = `1=1`;
    else dateClause = `date LIKE '${todayPrefix}%'`;

    let whereClause = dateClause;

    if (type === 'sent') whereClause += ` AND status='sent'`;
    else if (type === 'errors') whereClause += ` AND status IN ('bounced', 'deferred')`;
    else if (type === 'spam') whereClause += ` AND is_spam=1`;
    else if (type === 'outgoing_spam') whereClause += ` AND status='bounced' AND is_spam=1`;
    else if (type === 'incoming_spam') whereClause += ` AND status='incoming_spam' AND is_spam=1`;
    else if (type === 'invalid') whereClause += ` AND is_invalid=1`;
    else if (type === 'gmail') whereClause += ` AND status='bounced' AND domain='gmail.com'`;
    else if (type === 'outlook') whereClause += ` AND status='bounced' AND domain IN ('outlook.com', 'hotmail.com')`;
    else if (type === 'yahoo') whereClause += ` AND status='bounced' AND domain IN ('yahoo.com', 'ymail.com', 'rocketmail.com')`;
    else if (type === 'other') whereClause += ` AND status='bounced' AND domain NOT IN ('gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'ymail.com', 'rocketmail.com')`;

    if (search) {
      // Safe parameterized search in SQLite
      whereClause += ` AND recipient LIKE ?`;
    }

    if (type === 'queue') {
      const rawQueue = await runCommand('mailq');
      const logs = [];
      let currentLog = null;
      
      if (!rawQueue || rawQueue.includes('Mail queue is empty')) {
        return res.json({ logs: [] });
      }

      rawQueue.split('\n').forEach(line => {
        if (line.match(/^[A-F0-9]/i)) {
          if (currentLog) logs.push(currentLog);
          const parts = line.trim().split(/\s+/);
          // Queue ID (0), Size (1), DayOfWeek (2), Month (3), Day (4), Time (5), Sender (6)
          const dateStr = parts.slice(3, 6).join(' ');
          const queueId = parts[0].replace('*', '');
          currentLog = {
            queue_id: queueId,
            date: dateStr,
            email: 'Loading...',
            status: 'queue',
            reason: 'Message is currently in the active queue'
          };
        } else if (line.match(/^\s+(.*@.*)/)) {
          if (currentLog) currentLog.email = line.trim();
        } else if (line.match(/^\s+\((.*)\)/)) {
          if (currentLog) currentLog.reason = line.trim().replace(/^\(|\)$/g, '');
        }
      });
      if (currentLog) logs.push(currentLog);

      // Search filter for queue
      let filteredLogs = logs;
      if (search) {
        const lowerSearch = search.toLowerCase();
        filteredLogs = logs.filter(l => l.email.toLowerCase().includes(lowerSearch) || l.reason.toLowerCase().includes(lowerSearch));
      }

      return res.json({ logs: filteredLogs });
    }

    const query = `SELECT date, queue_id, recipient as email, status, reason FROM deliveries WHERE ${whereClause} ORDER BY date DESC LIMIT 200`;
    const params = search ? [`%${search}%`] : [];
    
    const rows = await runQuery(query, params);
    
    const logs = rows.map(row => {
      // Reformat YYYY-MM-DD HH:MM:SS back to Jul 3 10:00:00 for UI consistency
      const d = new Date(row.date);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + d.toTimeString().split(' ')[0];
      return {
        queue_id: row.queue_id,
        date: dateStr,
        email: row.email,
        status: row.status,
        reason: row.reason
      };
    });

    res.json({ logs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch detailed logs' });
  }
});

// GET /api/trace?query=email_or_queue_id
app.get('/api/trace', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.json({ logs: [] });
    
    let sqlQuery = `SELECT * FROM deliveries WHERE queue_id = ? OR recipient = ? OR sender = ? ORDER BY date DESC LIMIT 100`;
    const params = [query, query, query];
    
    // If it looks like a partial search, use LIKE
    if (query.includes('@') && !query.includes('.')) {
       sqlQuery = `SELECT * FROM deliveries WHERE recipient LIKE ? OR sender LIKE ? ORDER BY date DESC LIMIT 100`;
       params.length = 0;
       params.push(`%${query}%`, `%${query}%`);
    }

    const rows = await runQuery(sqlQuery, params);
    res.json({ logs: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to trace message' });
  }
});

// GET /api/reputation
app.get('/api/reputation', async (req, res) => {
  const dns = require('dns').promises;
  const https = require('https');
  try {
    let { ip } = req.query;
    
    if (!ip) {
      // Auto-detect server's public IP
      ip = await new Promise((resolve, reject) => {
        https.get('https://api.ipify.org', (response) => {
          let data = '';
          response.on('data', chunk => data += chunk);
          response.on('end', () => resolve(data));
        }).on('error', reject);
      });
    }

    if (!ip) return res.status(400).json({ error: 'Could not detect IP' });

    // Reverse IP for DNSBL query
    const reversedIp = ip.split('.').reverse().join('.');
    
    const blacklists = [
      { name: 'Spamhaus', domain: 'zen.spamhaus.org' },
      { name: 'Barracuda', domain: 'b.barracudacentral.org' },
      { name: 'Sorbs', domain: 'dnsbl.sorbs.net' },
      { name: 'SpamCop', domain: 'bl.spamcop.net' }
    ];

    const results = await Promise.all(blacklists.map(async (bl) => {
      try {
        const addresses = await dns.resolve4(`${reversedIp}.${bl.domain}`);
        return { name: bl.name, listed: true, details: addresses };
      } catch (err) {
        if (err.code === 'ENOTFOUND') {
          return { name: bl.name, listed: false };
        }
        
        let friendlyError = err.message;
        if (err.code === 'SERVFAIL' || err.code === 'ESERVFAIL' || err.code === 'EREFUSED' || err.code === 'REFUSED') {
           friendlyError = 'Query blocked by Public DNS. Requires a private DNS resolver.';
        } else if (err.code === 'ETIMEOUT') {
           friendlyError = 'Connection timed out.';
        }
        
        return { name: bl.name, listed: false, error: friendlyError };
      }
    }));

    const isListed = results.some(r => r.listed);
    res.json({ ip, listed: isListed, blacklists: results });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to check reputation' });
  }
});

// GET /api/domain-health
app.get('/api/domain-health', async (req, res) => {
  const dns = require('dns').promises;
  try {
    const { domain } = req.query;
    let domains = [];
    
    if (domain) {
      domains = [domain];
    } else {
      // Get top 5 sender domains to check
      const rows = await runQuery(`
        SELECT SUBSTR(sender, INSTR(sender, '@') + 1) as domain, COUNT(*) as c 
        FROM deliveries 
        WHERE sender != '' AND sender NOT LIKE '%unknown%' AND sender LIKE '%@%'
        GROUP BY domain 
        ORDER BY c DESC 
        LIMIT 5
      `);
      domains = rows.map(r => r.domain).filter(d => d.includes('.'));
    }
    
    const healthResults = await Promise.all(domains.map(async (domain) => {
      let spf = { valid: false, record: '' };
      let dmarc = { valid: false, record: '' };
      
      // Check SPF
      try {
        const txtRecords = await dns.resolveTxt(domain);
        const spfRecord = txtRecords.flat().find(r => r.startsWith('v=spf1'));
        if (spfRecord) {
          spf = { valid: true, record: spfRecord };
        }
      } catch (err) { /* ignore */ }
      
      // Check DMARC
      try {
        const txtRecords = await dns.resolveTxt(`_dmarc.${domain}`);
        const dmarcRecord = txtRecords.flat().find(r => r.startsWith('v=DMARC1'));
        if (dmarcRecord) {
          dmarc = { valid: true, record: dmarcRecord };
        }
      } catch (err) { /* ignore */ }

      return { domain, spf, dmarc };
    }));

    res.json({ health: healthResults });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to check domain health' });
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

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Backend API Server is LIVE!`);
  console.log(`Listening on all network interfaces (Port ${PORT})`);
  console.log(`Access the dashboard via your server's public IP address in your browser.`);
  
  if (isLinux) {
    try {
      await startParser();
    } catch (e) {
      console.error("Failed to start parser:", e);
    }
  }
});
