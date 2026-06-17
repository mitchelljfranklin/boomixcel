// @author   Noah Skelton
// @description Reverts to older shape sizes on palette and changes the default expand / collapse width.

var panelCount = 0;
var DefaultPaletteWidth = 250;

function GM_addStyle(cssStr) {
  var target =
    document.getElementsByTagName("head")[0] || document.body || document.documentElement;
  var styleElement = document.createElement("style");
  styleElement.textContent = cssStr;
  target.appendChild(styleElement);
}

GM_addStyle(`
    .base_shape_container div{padding: 3px !important;}
    .qm-l-auto-fill-grid {grid-gap: 3px !important;}
    .palette_shape_container_with_hover { border: none !important; }
`);

function DisplayPalette(toggle, element) {
  if (!element || !element.children[0]) return;
  var panel = element.children[0];
  var firstChild = panel.children[1];
  var secondChild = panel.children[2];
  if (!firstChild || !secondChild) return;

  firstChild.style.display = toggle ? "none" : "";
  firstChild.style.left = toggle ? "-100%" : "0%";
  if (firstChild.children[0]) firstChild.children[0].style.display = toggle ? "none" : "";

  secondChild.style.display = toggle ? "" : "none";
  secondChild.style.left = toggle ? "0%" : "100%";
  if (secondChild.children[0]) secondChild.children[0].style.display = toggle ? "" : "none";

  if (element.attributes["ExpandButton"]) element.attributes["ExpandButton"].disabled = toggle;
  if (element.attributes["CloseButton"]) element.attributes["CloseButton"].disabled = !toggle;
}

function ExpandPalette(toggle, element) {
  var width = toggle ? element.attributes["PaletteWidth"] : 44;

  if (!toggle) element.attributes["PaletteWidth"] = element.clientWidth;
  element.attributes["ShapePaletteParent"].style.width = width + "px";
  element.attributes["CollapsibleDragger"].style.left = width + "px";
  element.attributes["BuildCanvas"].style.inset =
    "0px 0px 0px " + (width + 12) + "px";
  element.style.width = width + "px";
}

function InitCollapsiblePanel(panel) {
  var collapsibleElement = panel.children[1];
  var draggerPanel = panel.children[2];
  if (!collapsibleElement || !draggerPanel) return null;
  var dragger = draggerPanel.children[0];
  if (!dragger) return null;
  var expandButton = dragger.children[0];
  var closeButton = dragger.children[2];
  if (!expandButton || !closeButton) return null;

  collapsibleElement.attributes["PaletteWidth"] = DefaultPaletteWidth;
  collapsibleElement.attributes["ShapePaletteParent"] = collapsibleElement.children[0];
  collapsibleElement.attributes["CollapsibleDragger"] = draggerPanel;
  collapsibleElement.attributes["BuildCanvas"] = panel.children[3];
  collapsibleElement.attributes["ExpandButton"] = expandButton;
  collapsibleElement.attributes["CloseButton"] = closeButton;

  expandButton.onclick = function () {
    ExpandPalette(true, collapsibleElement);
  };
  closeButton.onclick = function () {
    ExpandPalette(false, collapsibleElement);
  };
  dragger.ondblclick = function () {
    ExpandPalette(closeButton.disabled, collapsibleElement);
  };

  return collapsibleElement;
}

var resizeObserver = new ResizeObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.contentRect.width == 700) {
      ExpandPalette(true, entry.target);
    }
    //Change control display based on width (44 = closed)
    else DisplayPalette(entry.contentRect.width > 44, entry.target);
  });
});

var docObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (!mutation.addedNodes) return;

    var panels = document.getElementsByClassName("collapsible_base_panel");

    if (panels && panels.length != panelCount) {
      panelCount = panels.length;

      for (var i = 1; i < panels.length; i++) {
        if (!panels[i].attributes["sizeobserved"]) {
          var initializedPanel = InitCollapsiblePanel(panels[i]);
          if (initializedPanel) resizeObserver.observe(initializedPanel);

          panels[i].attributes["sizeobserved"] = true;
        }
      }
    }
  });
});

docObserver.observe(document, {
  childList: true,
  subtree: true,
  attributes: false,
  characterData: false /*, attributeFilter: ['class']*/,
});
