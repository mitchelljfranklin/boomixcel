/**
 * Shared Boomi-style modal dialog renderer.
 *
 * USAGE:
 *   let html = renderBoomiModal({
 *     overlayClass: "BoomiUpdateOverlay",    // CSS class for the overlay container (default: "BoomiPlatformOverlay")
 *     width: "440px",                        // modal width (default: "440px")
 *     title: "My Dialog",                    // optional header title (omit for no header)
 *     body: "<h1>Hello</h1><p>Body text</p>", // inner HTML content
 *     buttons: [                             // array of button objects
 *       { id: "okBtn", className: "gwt-Button qm-button--primary-action action_button", text: "OK", attrs: ' title="OK"' },
 *       { id: "cancelBtn", className: "gwt-Button", text: "Cancel" },
 *     ],
 *     showInfoIcon: false,                   // hide the info icon in the alert body (default: true)
 *     alertVariant: "qm-c-alert--none",      // CSS class for the alert variant (default: "qm-c-alert--info")
 *     extraBodyClasses: "",                  // extra classes on the body wrapper div (default: "updated_typography c-whats-new")
 *     extraPopupClasses: "bph-load-done",    // extra classes on the popupContent div
 *     modern: true,                          // apply modern styling (rounded corners, softer shadow, button gap, tighter spacing)
 *   });
 *
 * CLEANUP:
 *   removeBoomiOverlay("BoomiUpdateOverlay"); // removes any existing overlay before showing a new one
 *
 * ALL NEW MODALS MUST use this helper. Do not write inline modal HTML.
 */

var MODAL_SPINNER_HTML = '<div class="button_spinner_panel no_display"><i class="font_icon icon-spinner before-animate-spin spinner"></i></div>';

function renderBoomiModal(options) {
  var opts = options || {};
  var overlayClass = opts.overlayClass || "BoomiPlatformOverlay";
  var width = opts.width || "440px";
  var title = opts.title || "";
  var body = opts.body || "";
  var buttons = opts.buttons || [];
  var showInfoIcon = opts.showInfoIcon !== false;
  var alertVariant = opts.alertVariant || "qm-c-alert--info";
  var extraBodyClasses = opts.extraBodyClasses || "updated_typography c-whats-new";
  var extraPopupClasses = opts.extraPopupClasses || "";
  var modern = opts.modern === true;

  var buttonHtml = buttons.map(function (buttonDef) {
    var attrs = buttonDef.attrs || "";
    return '<button id="' + (buttonDef.id || "") + '" type="button" class="' + (buttonDef.className || "gwt-Button") + '"' + attrs + '>' + (buttonDef.text || "") + '</button>';
  }).join("");

  var infoIconHtml = showInfoIcon
    ? '<span class="qm-c-alert__icon"><img src="' + SVG_INFO_ICON + '" alt="Information"></span>'
    : '<span class="qm-c-alert__icon"></span>';

  return '<div class="center_panel ' + overlayClass + (modern ? ' bph-modern-modal' : '') + '" id="popup_on_popup_content" role="dialog" aria-modal="true">'
    + '<div class="popupContent ' + extraPopupClasses + '">'
    + '<div class="modal modal_top">'
    + '<div class="modal_contents">'
    + '<div class="margin_popup_contents notification_min_width" style="width: ' + width + ';">'
    + (title ? '<div class="form_header"><div class="form_title no_required"><div class="form_title_top"><h2 class="form_title_label">' + title + '</h2></div></div></div>' : '')
    + '<div class="qm-c-alert ' + alertVariant + '" style="max-height: 600px; overflow: auto;">'
    + infoIconHtml
    + '<div class="qm-c-alert__text">'
    + '<div class="' + extraBodyClasses + '">'
    + body
    + '</div></div></div></div></div>'
    + '<div class="button_set">'
    + MODAL_SPINNER_HTML
    + buttonHtml
    + '</div></div></div></div>';
}

// Removal helpers
function removeBoomiOverlay(className) {
  var overlay = document.querySelector("." + (className || "BoomiPlatformOverlay"));
  if (overlay) overlay.remove();
}
