// downloadRename.js — intercepts Boomi document download buttons and renames
// the downloaded file to <ProcessName>_<timestamp>.<ext> via the background worker.

const DOWNLOAD_BUTTON_SELECTOR = '[data-locator="link-download-original-document"]';

// ── Type detection from textarea content ──────────────────────────────────────

function detectTypeFromText(raw) {
  const trimmed = raw.trimStart();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json';
  if (trimmed.startsWith('<'))                           return 'xml';
  if (trimmed.startsWith('ISA'))                         return 'edi';
  if (trimmed.startsWith('UNA') || trimmed.startsWith('UNB')) return 'edi';
  if (isBinaryContent(trimmed))                          return null;
  if (/^[\x20-\x7E]/.test(trimmed))                     return trimmed.includes(',') ? 'csv' : 'txt';
  return null;
}

function isBinaryContent(str) {
  if (str.includes('\x00')) return true;
  var nonPrintable = 0;
  var sampleSize = Math.min(str.length, 500);
  for (var i = 0; i < sampleSize; i++) {
    var code = str.charCodeAt(i);
    if (code > 0x7E || (code < 0x20 && code !== 0x09 && code !== 0x0A && code !== 0x0D)) {
      nonPrintable++;
    }
  }
  return (nonPrintable / sampleSize) > 0.05;
}

// ── Execution timestamp from build-page date cells ───────────────────────────

function parseBoomiDate(str) {
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{1,2}):(\d{2}):(\d{2}) ([AP]M)$/);
  if (!match) return null;
  let hr = parseInt(match[4]);
  if (match[7] === 'PM' && hr !== 12) hr += 12;
  if (match[7] === 'AM' && hr === 12) hr = 0;
  return new Date(+match[1], +match[2] - 1, +match[3], hr, +match[5], +match[6]);
}

function formatTimestamp(date) {
  if (!date) return null;
  const pad = function (number) { return String(number).padStart(2, '0'); };
  return date.getFullYear() + pad(date.getMonth() + 1) + pad(date.getDate()) + "_" + pad(date.getHours()) + pad(date.getMinutes()) + pad(date.getSeconds());
}

function findReportingPageDate() {
  const timeDefinitionTerm = Array.from(document.querySelectorAll('.property_list dt'))
    .find(function (definitionTerm) { return definitionTerm.textContent.trim() === 'Time:'; });
  if (!timeDefinitionTerm) return null;
  const text = timeDefinitionTerm.nextElementSibling?.textContent?.trim();
  if (!text) return null;
  const match = text.match(/^(\d{1,2}) ([A-Za-z]{3}) (\d{4}) (\d{2}):(\d{2}):(\d{2})$/);
  if (!match) return null;
  const months = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };
  const monthIndex = months[match[2]];
  if (monthIndex === undefined) return null;
  return new Date(+match[3], monthIndex, +match[1], +match[4], +match[5], +match[6]);
}

function findEarliestExecutionDate() {
  const dateRe = /^\d{4}-\d{2}-\d{2} \d{1,2}:\d{2}:\d{2} [AP]M$/;
  const cells = Array.from(document.querySelectorAll('div[__gwt_cell^="cell-gwt-uid-"]'));
  const dates = cells
    .map(function (cellElement) { return cellElement.textContent.trim(); })
    .filter(function (text) { return dateRe.test(text); })
    .map(parseBoomiDate)
    .filter(Boolean);
  if (dates.length === 0) return null;
  dates.sort(function (a, b) { return a - b; });
  return dates[0];
}

// ── Context extraction ────────────────────────────────────────────────────────

function extractDownloadContext(buttonElement) {
  const dialog =
    buttonElement.closest('[role="dialog"]') ||
    document.getElementById('popup_on_popup_content_DocumentDialogContents') ||
    document.body;

  const activeTabWidget = document.querySelector('.gwt-TabLayoutPanelTab-selected .build_closeable_tab_widget');
  const activeTabName = activeTabWidget?.getAttribute('title');
  const processLinkEl = Array.from(document.querySelectorAll('[data-locator^="link-process-"]'))
    .find(function (linkElement) { return linkElement.textContent.trimStart().startsWith('Process:'); });
  const processTitleEl = document.querySelector('.form_title_label:not(.no_display)');
  const processName = activeTabName
    ?? processLinkEl?.textContent?.trim().replace(/^Process:\s*/i, '')
    ?? processTitleEl?.textContent?.trim()
    ?? null;

  const allTextareas = Array.from(dialog.querySelectorAll('.documentViewer textarea.gwt-TextArea'));
  const textareaContent = allTextareas.map(function (textarea) { return textarea.value || textarea.textContent; }).find(function (content) { return content.length > 0; }) || '';
  const content = textareaContent || (documentViewerRawContent || '');
  const fileExt = content ? detectTypeFromText(content) : null;

  const execTimestamp = formatTimestamp(findEarliestExecutionDate() ?? findReportingPageDate());

  return { processName, fileExt, execTimestamp };
}

// ── Download button hook ───────────────────────────────────────────────────────

function hookDownloadButton(button) {
  if (button.dataset.bphDownloadHooked) return;
  button.dataset.bphDownloadHooked = 'true';
  let passing = false;

  button.addEventListener('click', async function (event) {
    if (passing) return;

    if (!chrome.runtime?.id) {
      return;
    }

    event.stopPropagation();
    event.preventDefault();

    const { processName, fileExt, execTimestamp } = extractDownloadContext(button);
    await chrome.runtime.sendMessage({ type: 'DOWNLOAD_CONTEXT', context: { processName, execTimestamp }, fileExt });

    passing = true;
    button.click();
    passing = false;
  }, { capture: true });
}

function scanForDownloadButtons() {
  document.querySelectorAll(DOWNLOAD_BUTTON_SELECTOR).forEach(hookDownloadButton);
}

const downloadButtonObserver = new MutationObserver(scanForDownloadButtons);
downloadButtonObserver.observe(document.body, { childList: true, subtree: true });
scanForDownloadButtons();
