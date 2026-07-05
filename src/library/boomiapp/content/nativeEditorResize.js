document.arrive(
  "#popup_on_popup_content_InlineScriptEditorPanel",
  function (popup) {
    if (popup.querySelector(".bpe-editor-resize-handle")) return;

    var flexPanel = popup.querySelector(".flex_panel");
    var modalTop = popup.querySelector(".modal_top");
    if (!flexPanel || !modalTop) return;

    modalTop.classList.add("bpe-editor-modal");

    var resizeHandle = document.createElement("div");
    resizeHandle.className = "bpe-editor-resize-handle";
    modalTop.appendChild(resizeHandle);

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
      window.dispatchEvent(new Event("resize"));
    });

    function endResize(pointerEvent) {
      if (!resizing) return;
      resizing = false;
      if (resizeHandle.hasPointerCapture(pointerEvent.pointerId)) {
        resizeHandle.releasePointerCapture(pointerEvent.pointerId);
      }
      document.body.classList.remove("bph-resizing");
      popup.style.left = ((window.innerWidth - flexPanel.offsetWidth) / 2) + "px";
      popup.style.top = ((window.innerHeight - flexPanel.offsetHeight) / 2) + "px";
      window.dispatchEvent(new Event("resize"));
    }

    resizeHandle.addEventListener("pointerup", endResize);
    resizeHandle.addEventListener("pointercancel", endResize);
  },
);
