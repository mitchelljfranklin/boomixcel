document.arrive(
  '.gwt-TextArea.validatable[data-locator="formrow-sql"]',
  function () {
    var progShape = $(this).closest(".prog_cmd_panel");
    if (progShape.length === 0) return;

    var bpeButtonId = `#bpe-sql-editor-button-${this.id}`;
    $(progShape)
      .find(`button[data-locator="button-edit-sql"]`)
      .parent()
      .remove();
    $(this)
      .parent()
      .append(
        `<button type="button" class="gwt-Button qm-button--primary-action" id="bpe-sql-editor-button-${this.id}" textareaid="${this.id}"style="display: block">Edit SQL</button>`,
      );

    $(bpeButtonId).click(function (e) {
      let textAreaId = `#${e.target.getAttribute("textareaid")}`;

      $("body").append(renderMessageEditorPopup(this.id, "sql"));

      var code = $(textAreaId)[0].value;

      var editor = CodeMirror($("#bpe-message-editor")[0], {
        value: code,
        mode: "sql",
        lineNumbers: true,
        autoCloseTags: true,
        autoCloseBrackets: true,
      });

      editor.setOption("theme", getCodeMirrorEditorTheme());

      enableEditorPopupResize(editor);

      $("#bpe-message-editor-ok").click(function () {
        let code = editor.getValue();
        $(textAreaId)[0].value = code;
        $("#popup_on_popup_content, #popup_on_popup").remove();
      });

      $("#bpe-message-editor-cancel").click(function () {
        $("#popup_on_popup_content, #popup_on_popup").remove();
      });

      $("#bpe-message-editor-language").change(function (e) {
        editor.setOption("mode", langs[e.target.value].mode);
      });
    });
  },
);

document.arrive(
  '.gwt-TextArea.validatable[data-locator="formrow-sql-query"]',
  function () {
    var sqlQueryTextarea = this;
    if (sqlQueryTextarea.classList.contains("bph-sql-query-done")) return;
    sqlQueryTextarea.classList.add("bph-sql-query-done");

    var container = $(sqlQueryTextarea).parent();
    var validationPanel = container.parent();

    var editButtonId = `#bpe-sql-query-button-${sqlQueryTextarea.id}`;
    validationPanel.append(
      `<button type="button" class="gwt-Button qm-button--primary-action bpe-sql-query-button" id="bpe-sql-query-button-${sqlQueryTextarea.id}" textareaid="${sqlQueryTextarea.id}">Edit SQL</button>`,
    );

    $(editButtonId).click(function (clickEvent) {
      let textAreaId = `#${clickEvent.target.getAttribute("textareaid")}`;

      $("body").append(renderMessageEditorPopup(this.id, "sql"));

      var code = $(textAreaId)[0].value;

      var editor = CodeMirror($("#bpe-message-editor")[0], {
        value: code,
        mode: "sql",
        lineNumbers: true,
        autoCloseTags: true,
        autoCloseBrackets: true,
      });

      editor.setOption("theme", getCodeMirrorEditorTheme());

      enableEditorPopupResize(editor);

      $("#bpe-message-editor-ok").click(function () {
        let code = editor.getValue();
        $(textAreaId)[0].value = code;
        $("#popup_on_popup_content, #popup_on_popup").remove();
      });

      $("#bpe-message-editor-cancel").click(function () {
        $("#popup_on_popup_content, #popup_on_popup").remove();
      });

      $("#bpe-message-editor-language").change(function (changeEvent) {
        editor.setOption("mode", langs[changeEvent.target.value].mode);
      });
    });

    container.addClass("bph-sql-resize-container");
    var resizeHandle = document.createElement("div");
    resizeHandle.className = "bph-sql-resize-handle";
    container[0].appendChild(resizeHandle);

    resizeHandle.addEventListener("mousedown", function (mouseDownEvent) {
      mouseDownEvent.preventDefault();
      var startX = mouseDownEvent.clientX;
      var startY = mouseDownEvent.clientY;
      var startWidth = sqlQueryTextarea.offsetWidth;
      var startHeight = sqlQueryTextarea.offsetHeight;
      document.body.classList.add("bph-resizing");

      function onResizeMove(moveEvent) {
        var newWidth = startWidth + (moveEvent.clientX - startX);
        var newHeight = startHeight + (moveEvent.clientY - startY);
        if (newWidth < 150) newWidth = 150;
        if (newHeight < 60) newHeight = 60;
        sqlQueryTextarea.style.width = newWidth + "px";
        sqlQueryTextarea.style.height = newHeight + "px";
      }

      function onResizeEnd() {
        document.removeEventListener("mousemove", onResizeMove);
        document.removeEventListener("mouseup", onResizeEnd);
        document.body.classList.remove("bph-resizing");
      }

      document.addEventListener("mousemove", onResizeMove);
      document.addEventListener("mouseup", onResizeEnd);
    });
  },
);
