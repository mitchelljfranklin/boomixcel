var langs = {
  plain_text: { mode: "default", display: "Plain Text" },
  json: { mode: { name: "javascript", json: true }, display: "JSON" },
  xml: { mode: "xml", display: "XML" },
  html: { mode: { name: "xml", html: true }, display: "HTML" },
  sql: { mode: "sql", display: "SQL" },
};

document.arrive(
  '.gwt-TextArea.validatable[data-locator="formrow-message"]',
  function () {
    var bpeButtonId = `#bpe-message-editor-button-${this.id}`;
    $(this)
      .parent()
      .append(
        `<button type="button" class="gwt-Button qm-button--primary-action" id="bpe-message-editor-button-${this.id}" textareaid="${this.id}"style="display: block">Edit Message</button>`,
      );

    $(bpeButtonId).click(function (clickEvent) {
      let textAreaId = `#${clickEvent.target.getAttribute("textareaid")}`;

      $("body").append(renderMessageEditorPopup(this.id));

      var code = $(textAreaId)[0]
        .value.replace(/^'*/, "")
        .replace(/'*$/, "")
        .replace(/'({\d+})'/g, "$1");

      var editor = CodeMirror($("#bpe-message-editor")[0], {
        value: code,
        mode: "default",
        lineNumbers: true,
        autoCloseTags: true,
        autoCloseBrackets: true,
      });

      switch (code.charAt(0)) {
        case "{":
          editor.setOption("mode", langs["json"].mode);
          $("#bpe-message-editor-language")[0].value = "json";
          break;
        case "[":
          editor.setOption("mode", langs["json"].mode);
          $("#bpe-message-editor-language")[0].value = "json";
          break;
        case "<":
          if (code.includes("<html>")) {
            editor.setOption("mode", langs["html"].mode);
            $("#bpe-message-editor-language")[0].value = "html";
            break;
          }
          editor.setOption("mode", langs["xml"].mode);
          $("#bpe-message-editor-language")[0].value = "xml";
          break;
      }

      editor.setOption("theme", getCodeMirrorEditorTheme());

      enableEditorPopupResize(editor);

      // Ok
      $("#bpe-message-editor-ok").click(function () {
        let lang = $("#bpe-message-editor-language")[0].value;
        let code = editor.getValue();

        switch (lang) {
          case "json":
            if (code?.trim())
              code = code
                .trim()
                .replace(/^'*/, "'")
                .replace(/'*$/, "'")
                .replace(/'*({\d+})'*/g, "'$1'");
            break;
        }
        $(textAreaId)[0].value = code;
        $("#popup_on_popup_content, #popup_on_popup").remove();
      });

      // Cancel
      $("#bpe-message-editor-cancel").click(function () {
        $("#popup_on_popup_content, #popup_on_popup").remove();
      });

      // Change
      $("#bpe-message-editor-language").change(function (changeEvent) {
        editor.setOption("mode", langs[changeEvent.target.value].mode);
      });
    });
  },
);

function renderMessageEditorPopup(id, lang) {
  let left = Math.abs(window.innerWidth / 2) - 600;
  let top = Math.abs(window.innerHeight / 2) - 340;

  let lang_html = "";
  let title = "Edit Message";
  if (!lang) {
    for (const [key, value] of Object.entries(langs)) {
      lang_html += `<option value="${key}">${value.display}</option>`;
    }
  } else {
    title = `Edit ${lang.toUpperCase()}`;
    lang_html = `<option value="${lang}">${langs[lang].display}</option>`;
  }

  let html = `
    <div class="popup_on_popup" id="popup_on_popup" style="position: absolute; left: 0px; top: 0px; visibility: visible; display: block; width: 100%; height: 100%;"></div>
    <div class="center_panel" id="popup_on_popup_content" role="dialog" aria-modal="true" style="left: ${left}px; top: ${top}px; visibility: visible; position: absolute; overflow: visible;">
        <div class="popupContent">
            <div class="modal modal_top bpe-editor-modal"> 
                <div class="modal_contents">
                    <div class="flex_panel flex_panel_message_editor">
                        <div class="form_header inline_script_editor_header">
                            <div class="form_title no_required">
                                <div class="form_title_top">
                                    <h2 class="form_title_label">${title}</h2>
                                </div>
                                <dl class="property_list no_display"></dl>
                                <p class="form_summary no_display"></p>
                            </div>
                        </div>
                        <div class="inline_script_editor_settings_row">
                            <div class="inline_script_editor_language_list">
                                <div class="form_row">
                                    <div class="form_label">
                                        <label for="bpe-message-editor-language">Language
                                            <span class="form_label_required">*</span>
                                        </label> 
                                        <span class="form_label_required_text">(required)</span>
                                    </div>
                                    <div class="validation_panel">
                                        <div class="container">
                                            <select class="gwt-ListBox validatable" id="bpe-message-editor-language">
                                                ${lang_html}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="inline_script_editor_body">
                            <div style="height: 100%; position: absolute; width: 100%;">
                                <div class="collapsible_base_panel" style="position: relative;">
                                    <div aria-hidden="true" style="position: absolute; z-index: -32767; top: -20ex; width: 10em; height: 10ex; visibility: hidden;">&nbsp;</div>
                                    <div class="inline_script_editor_code_container">
                                        <div id="bpe-message-editor" class="inline_script_editor_code_container">
                                            <!-- MESSAGE EDITOR GOES HERE -->
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="button_set left">
                    <button type="button" class="gwt-Button qm-button--primary-action" id="bpe-message-editor-ok" parent-id="${id}" >OK</button>
                    <button type="button" class="gwt-Button" id="bpe-message-editor-cancel">Cancel</button>
                </div>
                <div class="bpe-editor-resize-handle"></div>
            </div>
        </div>
    </div>`;

  return html;
}

function enableEditorPopupResize(codeMirrorEditor) {
  var flexPanel = document.querySelector(".flex_panel_message_editor");
  var resizeHandle = document.querySelector(".bpe-editor-resize-handle");
  if (!flexPanel || !resizeHandle) return;

  var startX = 0;
  var startY = 0;
  var startWidth = 0;
  var startHeight = 0;
  var resizing = false;

  resizeHandle.addEventListener("pointerdown", function (pointerDownEvent) {
    pointerDownEvent.preventDefault();
    resizing = true;
    startX = pointerDownEvent.clientX;
    startY = pointerDownEvent.clientY;
    startWidth = flexPanel.offsetWidth;
    startHeight = flexPanel.offsetHeight;
    document.body.classList.add("bph-resizing");
    resizeHandle.setPointerCapture(pointerDownEvent.pointerId);
  });

  resizeHandle.addEventListener("pointermove", function (pointerMoveEvent) {
    if (!resizing) return;
    var newWidth = startWidth + (pointerMoveEvent.clientX - startX);
    var newHeight = startHeight + (pointerMoveEvent.clientY - startY);
    if (newWidth < 480) newWidth = 480;
    if (newHeight < 320) newHeight = 320;
    if (newWidth > window.innerWidth) newWidth = window.innerWidth;
    if (newHeight > window.innerHeight) newHeight = window.innerHeight;
    flexPanel.style.setProperty("width", newWidth + "px", "important");
    flexPanel.style.setProperty("height", newHeight + "px", "important");
    codeMirrorEditor.refresh();
  });

  function endResize(pointerEvent) {
    if (!resizing) return;
    resizing = false;
    if (resizeHandle.hasPointerCapture(pointerEvent.pointerId)) {
      resizeHandle.releasePointerCapture(pointerEvent.pointerId);
    }
    document.body.classList.remove("bph-resizing");
    codeMirrorEditor.refresh();
  }

  resizeHandle.addEventListener("pointerup", endResize);
  resizeHandle.addEventListener("pointercancel", endResize);
}
