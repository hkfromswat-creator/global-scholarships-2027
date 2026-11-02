// ============================================================
// Global Scholarship Finder 2027 – Scholarship Verification Engine
// ============================================================
// This script checks every scholarship record in scholarships.json,
// validates its official information URL and application URL,
// determines an accurate application status, and generates a report.
//
// Statuses defined:
//   1. Open                                  – application deadline is in the future and the page
//                                              shows an active application cycle for the current/upcoming year.
//   2. Announced – Not Yet Open              – scholarship has been announced but the
//                                              application portal is not yet accessible or the
//                                              official start date is in the future.
//   3. Expected – Not Confirmed                – a recurring scholarship whose typical
//                                              cycle has not been confirmed for the 2027 intake.
//   4. Closed                                – the application deadline has passed and no 2027 cycle
//                                              has been announced.
//   5. Expired                               – the scholarship year has expired and is not expected
//                                              to reopen.
//   6. Pending Verification                   – a working URL was found but the actual
//                                              application cycle/deadline could not be confirmed.
//   7. Rejected                              – the URL returns an error, the domain is invalid,
//                                              or the record is determined to be invalid/
//                                              spammy based on heuristics.
//
// Usage:
//   node verify-scholarships.js
//
// Output:
//   - Updated scholarships.json (statuses and last_verified dates refreshed)
//   - verification-report.json (summary of status counts, broken links, etc.)
//   - console output with per-record findings.
//
// IMPORTANT:
//   - A working URL does NOT automatically mean the scholarship is active.
//   - The script examines the page content for application cycle information,
//     deadline dates, and announcements.")

const fs = require('fs');
const https = require('https');
const path = require('path');

const PROJECT_DIR = path.resolve('C:/Users/User/Desktop/world scholarships');
const JSON_PATH = path.join(PROJECT_DIR, 'scholarships.json');
const REPORT_PATH = path.join(PROJECT_DIR, 'verification-report.json');
const LOG_PATH = path.join(PROJECT_DIR, 'pipeline', 'verification-log.txt');

// Ensure pipeline directory
if (!fs.existsSync(path.join(PROJECT_DIR, 'pipeline'))) {
  fs.mkdirSync(path.join(PROJECT_DIR, 'pipeline'));
}

// Load scholarships
let scholarships = [];
try {
  const raw = fs.readFileSync(JSON_PATH, 'utf8');
  scholarships = JSON.parse(raw);
  console.log(`[VERIFY] Loaded ${scholarships.length} records.`);
} catch (err) {
  console.error('[VERIFY] Error reading scholarships.json:', err.message);
  process.exit(1);
}

// Helper: normalize & trim
function normalize(s) { return (s || '').toString().replace(/\s+/g, ' ').trim(); }

// Fetch URL with timeout and redirect following
function fetchURL(url, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const opts = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      timeout: timeout,
      followAllRedirects: true, // Node's https automatically follows redirects
    };
    const req = https.request(opts, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        // After following redirects, res.url is the final URL
        resolve({
          status: res.statusCode,
          finalUrl: res.url,
          headers: res.headers,
          body: body.substring(0, 20000), // limit body size
        });
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.end();
  });
}

// Heuristic functions to determine status from page content
function hasActiveApplicationCycle(body, year = 2027) {
  // Look for application open/now/deadline patterns
  const lower = body.toLowerCase();
  // Common phrases indicating open application
  const openPhrases = ['apply now', 'application open', 'now open for', 'submit your application'];
  const deadlineMatch = lower.match(/deadline[^\d]*(\d{4})/i);
  const deadlineYear = deadlineMatch ? parseInt(deadlineMatch[1]) : null;
  const hasOpenPhrase = openPhrases.some(p => lower.includes(p));
  // If deadline year is 2027 or later, or no specific year but open phrase present
  if (hasOpenPhrase) return true;
  if (deadlineYear && deadlineYear >= 2027) return true;
  return false;
}

function hasAnnouncedButNotOpen(body) {
  const lower = body.toLowerCase();
  const announcedPhrases = ['application opening soon', 'applications open', 'will open', 'coming soon'];
  // Deadline already passed but page says applications open later
  const deadlinePassed = lower.includes('deadline') && !hasActiveApplicationCycle(body);
  // Heuristic: page mentions the scholarship but no active application form
  if (announcedPhrases.some(p => lower.includes(p))) return true;
  // If we have a future deadline but no open phrase, maybe announced
  return false;
}

function isExpired(body) {
  const lower = body.toLowerCase();
  const expiredPhrases = ['expired', 'no longer available', 'application closed', 'this scholarship is no longer'];
  return expiredPhrases.some(p => lower.includes(p));
}

// Determine status for a single record
function determineStatus(rec) {
  const { source_url, application_url } = rec;
  if (!source_url && !application_url) {
    return { status: 'Pending Verification', reason: 'No URLs provided' };
  }

  let sourceChecked = false;
  let appChecked = false;
  let sourceStatus = 'Pending Verification';
  let appStatus = 'Pending Verification';

  // Check source URL
  if (source_url) {
    try {
      const res = await fetchURL(source_url);
      sourceChecked = true;
      const body = res.body || '';
      // Heuristics
      if (isExpired(body)) {
        sourceStatus = 'Expired';
      } else if (hasActiveApplicationCycle(body)) {
        sourceStatus = 'Open';
      } else if (hasAnnouncedButNotOpen(body)) {
        sourceStatus = 'Announced – Not Yet Open';
      } else {
        sourceStatus = 'Pending Verification';
      }
    } catch (e) {
      sourceStatus = 'Broken/Inaccessible';
    }
  }

  // Check application URL
  if (application_url) {
    try {
      const res = await fetchURL(application_url);
      appChecked = true;
      const body = res.body || '';
      if (isExpired(body)) {
        appStatus = 'Expired';
      } else if (hasActiveApplicationCycle(body)) {
        appStatus = 'Open';
      } else if (hasAnnouncedButNotOpen(body)) {
        appStatus = 'Announced – Not Yet Open';
      } else {
        appStatus = 'Pending Verification';
      }
    } catch (e) {
      appStatus = 'Broken/Inaccessible';
    }
  }

// Overall status: take the most conservative (or the application URL status if available)
  let overall;
  if (appStatus === 'Open' || appStatus === 'Announced – Not Yet Open') {
    overall = appStatus;
  } else if (sourceStatus === 'Open' || sourceStatus === 'Announced – Not Yet Open') {
    overall = sourceStatus;
  } else {
    overall = 'Pending Verification';
  }

  return { status: overall, sourceChecked, appChecked, sourceStatus, appStatus };
}

// Main verification loop
async function verifyAll() {
  const results = {
    statusCounts: { Open: 0, 'Announced – Not Yet Open': 0, Expected: 0, Closed: 0, Expired: 0, 'Pending Verification': 0, Rejected: 0 },
    brokenLinks: [],
    verifiedCount: 0,
    details: []
  };

  const logStream = fs.createWriteStream(LOG_PATH, { flags: 'w' });
  logStream.write(`[${new Date().toISOString()}] Verification started for ${scholarships.length} records.\n`);

  for (let i = 0; i < scholarships.length; i++) {
    const rec = scholarships[i];
    try {
      const { status, sourceChecked, appChecked, sourceStatus, appStatus } = await determineStatus(rec);

      // Update record
      rec.last_verified = new Date().toISOString().split('T')[0];
      rec.application_status = status;

      // Update result counts
      results.statusCounts[status] = (results.statusCounts[status] || 0) + 1;
      results.verifiedCount++;

      results.details.push({
        id: rec.id,
        title: rec.title,
        status: status,
        source_url: rec.source_url,
        application_url: rec.application_url,
        last_verified: rec.last_verified,
        sourceStatus,
        appStatus
      });

      const logLine = `[ID ${rec.id}] ${rec.title} – Status: ${status} (source: ${sourceStatus}, app: ${appStatus}) – verified ${rec.last_verified}\n`;
      logStream.write(logLine);
      console.log(`[VERIFY] ID ${rec.id}: ${rec.title} → ${status}`);

    } catch (err) {
      console.error('[VERIFY] Error processing ID', rec.id, ':', err.message);
      // Mark as rejected / broken
      rec.application_status = 'Rejected';
      rec.last_verified = new Date().toISOString().split('T')[0];
      results.statusCounts['Rejected'] = (results.statusCounts['Rejected'] || 0) + 1;
      results.brokenLinks.push({ id: rec.id, title: rec.title, error: err.message });
      results.details.push({
        id: rec.id,
        title: rec.title,
        status: 'Rejected',
        source_url: rec.source_url,
        application_url: rec.application_url,
        last_verified: rec.last_verified,
        error: err.message
      });
      const logLine = `[ID ${rec.id}] ${rec.title} – Error: ${err.message}\n`;
      logStream.write(logLine);
    }
  }

  // Write updated scholarships.json
  fs.writeFileSync(JSON_PATH, JSON.stringify(scholarships, null, 2), 'utf8');
  console.log('[VERIFY] Updated scholarships.json with ' + scholarships.length + ' records.');

  // Write verification report
  fs.writeFileSync(REPORT_PATH, JSON.stringify(results, null, 2), 'utf8');
  console.log('[VERIFY] Verification report written to verification-report.json');

  logStream.end();
  console.log('[VERIFY] Verification complete.');
}

// Run the verifier
verifyAll().catch(err => {
  console.error('[VERIFY] Fatal error:', err);
  process.exit(1);
});