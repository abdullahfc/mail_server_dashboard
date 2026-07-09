const Tail = require('tail').Tail;
const { runInsert } = require('./db');
const os = require('os');
const fs = require('fs');
const readline = require('readline');

const isLinux = os.platform() === 'linux';
const logFile = '/var/log/mail.log';

// Map to keep track of queue IDs and their original senders
// E.g. { "4A1B2C3D": "sender@domain.com" }
const activeQueues = new Map();

// Helper to parse date from log line "Jul  9 08:35:10"
// Since postfix doesn't log the year, we append the current year.
const parseLogDate = (dateStr) => {
  const currentYear = new Date().getFullYear();
  const normalizedDate = dateStr.replace(/\s+/g, ' '); // "Jul  9" -> "Jul 9"
  const dateObj = new Date(`${normalizedDate} ${currentYear}`);
  return dateObj.toISOString().slice(0, 19).replace('T', ' '); // YYYY-MM-DD HH:MM:SS
};

const processLine = async (line) => {
  try {
    // We only care about lines with a Queue ID
    // E.g., "Jul  9 08:35:10 mail postfix/qmgr[123]: 4A1B2C3D: from=<sender@domain.com>"
    const regex = /^([A-Z][a-z]{2}\s+\d+\s+\d{2}:\d{2}:\d{2})\s+.*?\s+([A-F0-9]+):\s+(.*)$/;
    const match = line.match(regex);
    
    if (!match) return;

    const [_, dateStr, queueId, payload] = match;
    const formattedDate = parseLogDate(dateStr);

    // 1. Capture the Sender (from=<...>)
    const fromMatch = payload.match(/from=<([^>]+)>/i);
    if (fromMatch) {
      activeQueues.set(queueId, fromMatch[1]);
      // Cleanup map to prevent memory leaks (keep max 10,000 entries)
      if (activeQueues.size > 10000) {
        const firstKey = activeQueues.keys().next().value;
        activeQueues.delete(firstKey);
      }
      return;
    }

    // 2. Capture Deliveries (to=<...>, status=...)
    const toMatch = payload.match(/to=<([^>]+)>.*status=([^ ]+)\s+\((.*)\)/i);
    if (toMatch) {
      const recipient = toMatch[1];
      const status = toMatch[2]; // sent, bounced, deferred
      const reason = toMatch[3];
      
      const domainMatch = recipient.match(/@(.*)$/);
      const domain = domainMatch ? domainMatch[1] : 'unknown';
      
      const sender = activeQueues.get(queueId) || 'unknown';

      // Advanced Tagging
      const isSpam = /spam/i.test(reason) ? 1 : 0;
      const isInvalid = /user unknown|recipient address rejected|not found|no route/i.test(reason) ? 1 : 0;

      // Insert into our fast database
      await runInsert(`
        INSERT INTO deliveries (date, queue_id, sender, recipient, domain, status, reason, is_spam, is_invalid)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [formattedDate, queueId, sender, recipient, domain, status, reason, isSpam, isInvalid]);
      
      // We do not delete from activeQueues immediately because one queue ID can have multiple recipients!
      return;
    }
    
    // 3. Fallback for NOQUEUE rejects (they don't have a queue ID, the payload is directly NOQUEUE)
    if (line.includes('NOQUEUE: reject:')) {
      const noQueueMatch = line.match(/^([A-Z][a-z]{2}\s+\d+\s+\d{2}:\d{2}:\d{2}).*to=<([^>]+)>.*status=([^ ]+)\s+\((.*)\)/i);
      if (noQueueMatch) {
        const formattedDate = parseLogDate(noQueueMatch[1]);
        const recipient = noQueueMatch[2];
        const status = noQueueMatch[3];
        const reason = noQueueMatch[4];
        
        const domainMatch = recipient.match(/@(.*)$/);
        const domain = domainMatch ? domainMatch[1] : 'unknown';
        const isSpam = /spam/i.test(reason) ? 1 : 0;
        const isInvalid = /user unknown|recipient address rejected|not found|no route/i.test(reason) ? 1 : 0;

        await runInsert(`
          INSERT INTO deliveries (date, queue_id, sender, recipient, domain, status, reason, is_spam, is_invalid)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [formattedDate, 'NOQUEUE', 'unknown', recipient, domain, status, reason, isSpam, isInvalid]);
      }
    }

  } catch (error) {
    console.error('Error parsing line:', error);
  }
};

const backfillLogs = async () => {
  if (!fs.existsSync(logFile)) return;
  
  // Check if we already have data
  const { runQuery } = require('./db');
  const countRes = await runQuery("SELECT COUNT(*) as c FROM deliveries");
  if (countRes[0].c > 0) {
    console.log(`Database already has ${countRes[0].c} records. Skipping backfill.`);
    return;
  }

  console.log('Database is empty. Backfilling from current mail.log (this might take a moment)...');
  const fileStream = fs.createReadStream(logFile);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
  
  let processed = 0;
  for await (const line of rl) {
    await processLine(line);
    processed++;
    if (processed % 1000 === 0) console.log(`Backfilled ${processed} lines...`);
  }
  console.log(`Backfill complete! Processed ${processed} lines.`);
};

const startParser = async () => {
  if (!isLinux) {
    console.log('Parser disabled (not on Linux)');
    return;
  }

  if (!fs.existsSync(logFile)) {
    console.error(`Log file ${logFile} not found! Cannot start parser.`);
    return;
  }

  // Run backfill first
  await backfillLogs();

  console.log(`Starting real-time log parser on ${logFile}...`);
  const tail = new Tail(logFile, { fromBeginning: false });

  tail.on("line", function(data) {
    processLine(data);
  });

  tail.on("error", function(error) {
    console.error('Tail ERROR: ', error);
  });
};

module.exports = { startParser };
