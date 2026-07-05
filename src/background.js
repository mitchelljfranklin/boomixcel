// background.js — MV3 service worker

// ── State ─────────────────────────────────────────────────────────────────────

let pendingContext = null;
let pendingFileExt = null;

// ── Receive context + file type from content script on click ──────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'DOWNLOAD_CONTEXT') {
    pendingContext = msg.context;
    pendingFileExt = msg.fileExt ?? null;
  }
  if (msg.type === 'OPEN_OPTIONS') {
    chrome.runtime.openOptionsPage();
  }
  if (msg.type === 'EXECUTE_PROCESS') {
    handleExecuteProcess(msg.accountId, msg.processName, msg.envName)
      .then(sendResponse)
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

// ── Rename on download ────────────────────────────────────────────────────────

chrome.downloads.onDeterminingFilename.addListener((downloadItem, suggest) => {
  if (!isBoomiDownloadUrl(downloadItem.url)) {
    suggest();
    return true;
  }

  // Consume context once — cleared so it can't bleed into an unrelated download.
  const context = pendingContext;
  const ext     = pendingFileExt
                  || guessExtensionFromFilename(downloadItem.filename)
                  || 'dat';
  pendingContext = null;
  pendingFileExt = null;

  suggest({ filename: buildFilename(context, ext), conflictAction: 'uniquify' });
  return true;
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function isBoomiDownloadUrl(url) {
  return url.includes('platform.boomi.com') && url.includes('/download/');
}

function buildFilename(context, ext) {
  const parts = [];
  if (context?.processName)   parts.push(sanitize(context.processName));
  if (parts.length === 0)     parts.push('document');
  if (context?.execTimestamp) parts.push(context.execTimestamp);
  return parts.join('_') + '.' + ext;
}

function sanitize(str) {
  return str.replace(/[^a-zA-Z0-9_\-. ]/g, '').trim().replace(/\s+/g, '_');
}

function guessExtensionFromFilename(filename) {
  const match = filename?.match(/\.([a-z0-9]+)$/i);
  return match ? match[1] : null;
}

// ── Execute Process API ────────────────────────────────────────────────────────

async function handleExecuteProcess(accountId, processName, envName) {
  const { boomi_api_token, boomi_api_email } = await chrome.storage.sync.get(['boomi_api_token', 'boomi_api_email']);
  if (!boomi_api_token || !boomi_api_email) {
    return { success: false, error: 'Boomi API token or email not configured. Add them in BoomiXcel Options \u2192 Deployment.' };
  }

  const authHeader = 'Basic ' + btoa('BOOMI_TOKEN.' + boomi_api_email + ':' + boomi_api_token);
  const apiBase = `https://api.boomi.com/api/rest/v1/${accountId}`;

  let atomId = null;

  if (envName) {
    try {
      const queryResp = await fetch(`${apiBase}/Atom/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': authHeader,
        },
        body: '{}',
      });

      if (queryResp.ok) {
        const contentType = queryResp.headers.get('content-type') || '';
        const text = await queryResp.text();
        let data;
        if (contentType.includes('application/json')) {
          data = JSON.parse(text);
        } else {
          const parser = new DOMParser();
          const xml = parser.parseFromString(text, 'text/xml');
          const resultElements = xml.querySelectorAll('result > *');
          const results = [];
          resultElements.forEach(function (element) {
            const id = element.querySelector('id');
            const name = element.querySelector('name');
            if (id) results.push({ id: id.textContent, name: name ? name.textContent : '' });
          });
          data = { result: results };
        }
        const results = data.result || [];
        var envLower = envName.toLowerCase();
        for (var ri = 0; ri < results.length; ri++) {
          if (results[ri].name && results[ri].name.toLowerCase().indexOf(envLower) !== -1) {
            atomId = results[ri].id;
            break;
          }
        }
      }
    } catch (err) {
    }
  }

  let requestBody;
  if (atomId) {
    requestBody = `<ProcessExecutionRequest processName="${processName}" atomId="${atomId}" xmlns="http://api.platform.boomi.com/"/>`;
  } else {
    requestBody = `<ProcessExecutionRequest processName="${processName}" xmlns="http://api.platform.boomi.com/"/>`;
  }

  const execResp = await fetch(`${apiBase}/executeProcess`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/xml',
      'Authorization': authHeader,
    },
    body: requestBody,
  });

  if (!execResp.ok) {
    const errorText = await execResp.text().catch(() => '');
    return { success: false, error: `Execute failed (HTTP ${execResp.status}): ${errorText}` };
  }

  return { success: true };
}
