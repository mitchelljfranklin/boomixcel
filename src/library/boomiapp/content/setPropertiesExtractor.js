// setPropertiesExtractor.js — one-click extract all Set Properties shape
// configurations from the build canvas into a modal table.

var init_set_properties_extractor = (process) => {
  let nav = process.closest(".component_editor_panel").querySelector(".step_pellete");
  if (!nav || nav.querySelector(".bph-extract-setproperties")) return;

  let buttonHtml = [
    '<a class="gwt-Anchor svg-anchor others_floats bph-extract-setproperties" data-locator="extract-set-properties" title="Extract Set Properties">',
    '<svg width="40" height="40" viewBox="0 0 40 40" version="1.1" xmlns="http://www.w3.org/2000/svg" style="width:40px;height:40px">',
    '<circle cx="20" cy="20" r="19.5" fill="white" stroke="#CCCCCC"/>',
    '<g transform="translate(11, 11)">',
    '<path d="M4 3C4 2.44772 4.44772 2 5 2H13C13.5523 2 14 2.44772 14 3V5H4V3Z" fill="#666"/>',
    '<rect x="2" y="4" width="14" height="12" rx="1" fill="none" stroke="#666" stroke-width="1.2"/>',
    '<line x1="5" y1="7" x2="13" y2="7" stroke="#666" stroke-width="1.2" stroke-linecap="round"/>',
    '<line x1="5" y1="10" x2="13" y2="10" stroke="#666" stroke-width="1.2" stroke-linecap="round"/>',
    '<line x1="5" y1="13" x2="10" y2="13" stroke="#666" stroke-width="1.2" stroke-linecap="round"/>',
    '</g></svg></a>',
  ].join("");

  nav.insertAdjacentHTML("beforeend", buttonHtml);

  nav.querySelector(".bph-extract-setproperties").addEventListener("click", async () => {
    let results = await extractAllSetProperties();
    if (results.length === 0) {
      showToast("No Set Properties shapes found on the canvas.", 3000, "warning");
      return;
    }
    showSetPropertiesModal(results);
  });
};

function waitForSelector(selector, textMatch, timeoutMs) {
  return new Promise(resolve => {
    let start = Date.now();
    let timer = setInterval(() => {
      let elements = document.querySelectorAll(selector);
      let found = null;
      if (textMatch !== undefined) {
        found = [...elements].find(el => el.textContent.trim() === textMatch);
      } else if (elements.length > 0) {
        found = elements[0];
      }
      if (found) {
        clearInterval(timer);
        resolve(found);
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(timer);
        resolve(null);
      }
    }, 100);
  });
}

function dispatchMouseClick(element) {
  var rect = element.getBoundingClientRect();
  var options = {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX: rect.left + rect.width / 2,
    clientY: rect.top + rect.height / 2,
    button: 0,
    buttons: 1,
  };
  element.dispatchEvent(new MouseEvent('mousedown', options));
  element.dispatchEvent(new MouseEvent('mouseup', options));
  element.dispatchEvent(new MouseEvent('click', options));
}

async function extractAllSetProperties() {
  let images = document.querySelectorAll('img.gwt-Image[title="Set Properties"]');
  let seen = new Set();
  let wrappers = [];
  images.forEach(img => {
    let wrapper = img.closest('.dragdrop-draggable');
    if (wrapper && !seen.has(wrapper)) {
      seen.add(wrapper);
      wrappers.push(wrapper);
    }
  });
  if (wrappers.length === 0) return [];

  let currentSelected = document.querySelector('.dragdrop-draggable.dragdrop-selected');
  let results = [];

  for (let wrapper of wrappers) {
    let alreadySelected = wrapper.classList.contains('dragdrop-selected');
    if (!alreadySelected) {
      dispatchMouseClick(wrapper);
    }

    let panelLabel = await waitForSelector('.mock_form_label', "Properties to Set", 5000);
    if (!panelLabel) continue;

    await new Promise(resolve => setTimeout(resolve, 300));

    let displayNameInput = document.querySelector('input[data-locator="formrow-display-name"]');
    let displayName = displayNameInput ? displayNameInput.value.trim() : '';

    let propertyItems = document.querySelectorAll('.gwt-DataList > tbody .gwt-DataListItem');
    let propertyNames = [...propertyItems].map(el => el.textContent.trim());
    if (propertyNames.length === 0) continue;

    let allRows = document.querySelectorAll('.gwt-DataList > tbody tr');

    for (let i = 0; i < propertyNames.length; i++) {
      let row = allRows[i];
      if (row && !row.classList.contains('selected')) {
        let cell = row.querySelector('td');
        if (cell) {
          dispatchMouseClick(cell);
          await new Promise(resolve => setTimeout(resolve, 250));
        }
      }

      let paramsFound = await waitForSelector('.parameter_value_list_item .parameter_value', undefined, 2000);
      let paramValues = [];
      if (paramsFound) {
        await new Promise(resolve => setTimeout(resolve, 100));
        let paramElements = document.querySelectorAll('.parameter_value_list_item .parameter_value');
        paramValues = [...paramElements].map(el => el.textContent.trim());
      }

      results.push({
        displayName: displayName,
        propertyName: propertyNames[i],
        parameters: paramValues,
      });
    }
  }

  if (currentSelected) {
    dispatchMouseClick(currentSelected);
  }

  return results;
}

function escapeHtml(text) {
  let div = document.createElement('div');
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}

function showSetPropertiesModal(results) {
  let rowsHtml = results.map(row => {
    let params = row.parameters.length > 0
      ? row.parameters.map(p => escapeHtml(p)).join(', ')
      : '(none)';
    return '<tr><td>' + escapeHtml(row.displayName) + '</td><td>'
      + escapeHtml(row.propertyName) + '</td><td>' + params + '</td></tr>';
  }).join('');

  let bodyHtml = [
    '<div class="bpe-setprops-container">',
    '<table class="bpe-setprops-table">',
    '<thead><tr><th>Shape Display Name</th><th>Property</th><th>Parameters</th></tr></thead>',
    '<tbody>' + rowsHtml + '</tbody>',
    '</table>',
    '<div class="bpe-setprops-footer">',
    '<button class="gwt-Button bpe-setprops-export" id="bpe-setprops-export-btn">Export to Clipboard</button>',
    '<span class="bpe-setprops-count">' + results.length + ' propert' + (results.length === 1 ? 'y' : 'ies') + ' extracted</span>',
    '</div>',
    '</div>',
  ].join('');

  let modalHtml = renderBoomiModal({
    overlayClass: "BoomiPlatformOverlay",
    width: "800px",
    title: "Extracted Set Properties",
    showInfoIcon: false,
    alertVariant: "qm-c-alert--none",
    extraBodyClasses: "bpe-setprops-body",
    extraPopupClasses: "bpe-setprops-modal",
    modern: true,
    body: bodyHtml,
    buttons: [
      { className: "gwt-Button qm-button--primary-action action_button", text: "Close", attrs: ' data-locator="link-cancel"' },
    ],
  });

  let existing = document.querySelector(".BoomiPlatformOverlay");
  if (existing) existing.remove();
  document.body.insertAdjacentHTML("beforeend", modalHtml);

  document.getElementById("bpe-setprops-export-btn").addEventListener("click", () => {
    let tsv = 'Shape Display Name\tProperty\tParameters\n';
    results.forEach(row => {
      let params = row.parameters.length > 0 ? row.parameters.join(', ') : '';
      tsv += row.displayName + '\t' + row.propertyName + '\t' + params + '\n';
    });
    navigator.clipboard.writeText(tsv).then(() => {
      showToast("Set Properties data copied to clipboard as TSV.", 2500, "success");
    }).catch(() => {
      showToast("Failed to copy to clipboard.", 2500, "error");
    });
  });
}
