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
  if (msg.type === 'GET_RUNTIME_STATUS') {
    handleGetRuntimeStatus(msg.accountId)
      .then(sendResponse)
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
  if (msg.type === 'GET_COMPONENT_REFERENCES') {
    handleGetComponentReferences(msg.accountId, msg.componentId)
      .then(sendResponse)
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
  if (msg.type === 'GET_COMPONENT_XML') {
    handleGetComponentXml(msg.accountId, msg.componentId)
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

// ── Runtime Status API ─────────────────────────────────────────────────────────

var runtimeStatusCache = null;
var runtimeStatusCacheTime = 0;

async function handleGetRuntimeStatus(accountId) {
  var now = Date.now();
  // Return cached result if fresh (< 30 seconds)
  if (runtimeStatusCache && (now - runtimeStatusCacheTime) < 30000) {
    return { success: true, runtimes: runtimeStatusCache, cached: true };
  }

  var { boomi_api_token, boomi_api_email } = await chrome.storage.sync.get(['boomi_api_token', 'boomi_api_email']);
  if (!boomi_api_token || !boomi_api_email) {
    return { success: false, error: 'Boomi API token or email not configured.' };
  }

  var authHeader = 'Basic ' + btoa('BOOMI_TOKEN.' + boomi_api_email + ':' + boomi_api_token);
  var apiBase = 'https://api.boomi.com/api/rest/v1/' + accountId;

  try {
    var fetchResponse = await fetch(apiBase + '/Atom/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': authHeader,
      },
      body: '{}',
    });

    if (!fetchResponse.ok) {
      return { success: false, error: 'Atom query failed (HTTP ' + fetchResponse.status + ')' };
    }

    var data = await fetchResponse.json();
    var runtimes = (data.result || []).map(function (atom) {
      return {
        id: atom.id,
        name: atom.name,
        status: atom.status || 'UNKNOWN',
        statusDetail: atom.statusDetail || '',
        type: atom.type || 'ATOM',
        hostName: atom.hostName || '',
        currentVersion: atom.currentVersion || '',
        description: atom.description || '',
        instanceId: atom.instanceId || '',
        cloudId: atom.cloudId || '',
        cloudName: atom.cloudName || '',
        cloudMoleculeName: atom.cloudMoleculeName || '',
        cloudOwnerName: atom.cloudOwnerName || '',
        isCloudAttachment: !!atom.isCloudAttachment,
        dateInstalled: atom.dateInstalled || '',
        purgeHistoryDays: atom.purgeHistoryDays,
      };
    });

    runtimeStatusCache = runtimes;
    runtimeStatusCacheTime = now;

    return { success: true, runtimes: runtimes, cached: false };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Component References API ───────────────────────────────────────────────────

async function handleGetComponentReferences(accountId, componentId, parentDepth, childDepth) {
  var maxParentDepth = parentDepth || 2;
  var maxChildDepth = childDepth || 2;

  var { boomi_api_token, boomi_api_email } = await chrome.storage.sync.get(['boomi_api_token', 'boomi_api_email']);
  if (!boomi_api_token || !boomi_api_email) {
    return { success: false, error: 'Boomi API token or email not configured.' };
  }

  var authHeader = 'Basic ' + btoa('BOOMI_TOKEN.' + boomi_api_email + ':' + boomi_api_token);
  var apiBase = 'https://api.boomi.com/api/rest/v1/' + accountId;
  var visited = {};
  visited[componentId] = true;

  async function queryRefs(property, id, parentVersion) {
    try {
      var body;
      if (parentVersion !== undefined && parentVersion !== null) {
        body = JSON.stringify({ QueryFilter: { expression: { operator: 'and', nestedExpression: [
          { property: 'parentComponentId', operator: 'EQUALS', argument: [id] },
          { property: 'parentVersion', operator: 'EQUALS', argument: [String(parentVersion)] }
        ]}}});
      } else {
        body = JSON.stringify({ QueryFilter: { expression: { property: property, operator: 'EQUALS', argument: [id] } } });
      }
      var fetchResponse = await fetch(apiBase + '/ComponentReference/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': authHeader,
        },
        body: body,
      });
      if (!fetchResponse.ok) return [];
      var data = await fetchResponse.text();
      try {
        var json = JSON.parse(data);
        var allReferences = [];
        var result = json.result || [];
        for (var i = 0; i < result.length; i++) {
          var refs = result[i].references || [];
          allReferences = allReferences.concat(refs);
        }
        return allReferences;
      } catch (e) {
        return [];
      }
    } catch (e) {
      return [];
    }
  }

  async function getComponentInfo(id) {
    try {
      var fetchResponse = await fetch(apiBase + '/Component/' + id, {
        headers: { 'Authorization': authHeader, 'Accept': 'application/xml' },
      });
      if (!fetchResponse.ok) return null;
      var xml = await fetchResponse.text();
      var info = { name: null, version: null };
      // Extract name and version from XML attributes
      var tagMatch = xml.match(/<bns:Component[^>]*>/);
      if (tagMatch) {
        var nameMatch = tagMatch[0].match(/name="([^"]*)"/);
        var versionMatch = tagMatch[0].match(/version="(\d+)"/);
        if (nameMatch) info.name = nameMatch[1];
        if (versionMatch) info.version = parseInt(versionMatch[1], 10);
      }
      if (!info.version) {
        var vMatch = xml.match(/version="(\d+)"/);
        if (vMatch) info.version = parseInt(vMatch[1], 10);
      }
      if (!info.name) {
        var nMatch = xml.match(/name="([^"]*)"/);
        if (nMatch) info.name = nMatch[1];
      }
      if (!info.version) info.version = null;
      return info;
    } catch (e) {
      return null;
    }
  }

  async function walkParents(id, depth) {
    if (depth <= 0) return [];
    var refs = await queryRefs('componentId', id);
    var result = [];
    for (var i = 0; i < refs.length; i++) {
      var parentId = refs[i].parentComponentId;
      if (visited[parentId]) continue;
      visited[parentId] = true;
      var info = await getComponentInfo(parentId);
      result.push({
        id: parentId,
        name: info ? info.name : null,
        version: refs[i].parentVersion || 0,
        type: refs[i].type || '',
        children: await walkParents(parentId, depth - 1),
      });
    }
    return result;
  }

  async function walkChildren(id, depth, knownVersion) {
    if (depth <= 0) return [];
    var version = knownVersion;
    if (!version) {
      var info = await getComponentInfo(id);
      if (info) {
        version = info.version;
      }
    }
    if (!version) return [];
    var refs = await queryRefs('parentComponentId', id, version);
    var result = [];
    for (var i = 0; i < refs.length; i++) {
      var childId = refs[i].componentId;
      if (visited[childId]) continue;
      visited[childId] = true;
      var childInfo = await getComponentInfo(childId);
      result.push({
        id: childId,
        name: childInfo ? childInfo.name : null,
        type: refs[i].type || '',
        parentVersion: refs[i].parentVersion || 0,
        children: await walkChildren(childId, depth - 1),
      });
    }
    return result;
  }

  try {
    var parents = await walkParents(componentId, maxParentDepth);
    var children = await walkChildren(componentId, maxChildDepth);

    return { success: true, parents: parents, children: children, accountId: accountId };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Component XML API ──────────────────────────────────────────────────────────

async function handleGetComponentXml(accountId, componentId) {
  var { boomi_api_token, boomi_api_email } = await chrome.storage.sync.get(['boomi_api_token', 'boomi_api_email']);
  if (!boomi_api_token || !boomi_api_email) {
    return { success: false, error: 'Boomi API token or email not configured.' };
  }

  var authHeader = 'Basic ' + btoa('BOOMI_TOKEN.' + boomi_api_email + ':' + boomi_api_token);
  var apiBase = 'https://api.boomi.com/api/rest/v1/' + accountId;

  try {
    var fetchResponse = await fetch(apiBase + '/Component/' + componentId, {
      headers: { 'Authorization': authHeader, 'Accept': 'application/xml' },
    });

    if (!fetchResponse.ok) {
      return { success: false, error: 'Component fetch failed (HTTP ' + fetchResponse.status + ')' };
    }

    var xml = await fetchResponse.text();
    return { success: true, xml: xml };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── API Config Badge ───────────────────────────────────────────────────────────

function isBoomiTab(tab) {
  return tab && tab.url && tab.url.startsWith("https://platform.boomi.com");
}

async function updateBadge(tabId, url) {
  if (!url || !url.startsWith("https://platform.boomi.com")) {
    chrome.action.setBadgeText({ text: "", tabId: tabId });
    return;
  }

  var { boomi_api_token } = await chrome.storage.sync.get(["boomi_api_token"]);
  if (!boomi_api_token) {
    chrome.action.setBadgeText({ text: "!", tabId: tabId });
    chrome.action.setBadgeBackgroundColor({ color: "#e65100", tabId: tabId });
  } else {
    chrome.action.setBadgeText({ text: "", tabId: tabId });
  }
}

chrome.tabs.onActivated.addListener(function (activeInfo) {
  chrome.tabs.get(activeInfo.tabId, function (tab) {
    updateBadge(tab.id, tab.url);
  });
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status === "complete" || changeInfo.url) {
    updateBadge(tabId, tab.url || changeInfo.url);
  }
});

// Check all existing tabs on startup
chrome.runtime.onStartup.addListener(function () {
  chrome.tabs.query({}, function (tabs) {
    for (var i = 0; i < tabs.length; i++) {
      if (isBoomiTab(tabs[i])) {
        updateBadge(tabs[i].id, tabs[i].url);
      }
    }
  });
});

// Also check on extension install/update
chrome.runtime.onInstalled.addListener(function () {
  chrome.tabs.query({}, function (tabs) {
    for (var i = 0; i < tabs.length; i++) {
      if (isBoomiTab(tabs[i])) {
        updateBadge(tabs[i].id, tabs[i].url);
      }
    }
  });
});
