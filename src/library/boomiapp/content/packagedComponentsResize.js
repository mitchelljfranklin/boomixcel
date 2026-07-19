var _pkgSavedWidth = null;
var _pkgSavedHeight = null;

document.arrive(
  ".flex_panel.packaged_components_wizard",
  function (flexPanel) {
    if (flexPanel.dataset.bphPkgResizeApplied) return;
    flexPanel.dataset.bphPkgResizeApplied = "1";

    // Restore saved size from previous wizard step
    if (_pkgSavedWidth && _pkgSavedHeight) {
      flexPanel.style.setProperty("width", _pkgSavedWidth + "px", "important");
      flexPanel.style.setProperty("height", _pkgSavedHeight + "px", "important");
      var popup = flexPanel.closest(".center_panel") || flexPanel.closest("#popup_on_popup_content");
      if (popup) {
        popup.style.left = ((window.innerWidth - _pkgSavedWidth) / 2) + "px";
        popup.style.top = ((window.innerHeight - _pkgSavedHeight) / 2) + "px";
      }
      window.dispatchEvent(new Event("resize"));
    }

    var modalTop = flexPanel.closest(".modal_top");
    if (!modalTop) return;

    // Inject handle only once per modal (modal persists across wizard steps)
    if (!modalTop.querySelector(".bpe-editor-resize-handle")) {
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
        var currentFlex = modalTop.querySelector(".flex_panel.packaged_components_wizard");
        if (!currentFlex) return;
        resizing = true;
        startX = pointerDownEvent.clientX;
        startY = pointerDownEvent.clientY;
        startWidth = currentFlex.offsetWidth;
        startHeight = currentFlex.offsetHeight;
        document.body.classList.add("bph-resizing");
        resizeHandle.setPointerCapture(pointerDownEvent.pointerId);
      });

      resizeHandle.addEventListener("pointermove", function (pointerMoveEvent) {
        if (!resizing) return;
        // Find the current active flex panel (may have changed between wizard steps)
        var currentFlex = modalTop.querySelector(".flex_panel.packaged_components_wizard");
        if (!currentFlex) return;
        var newWidth = startWidth + (pointerMoveEvent.clientX - startX);
        var newHeight = startHeight + (pointerMoveEvent.clientY - startY);
        if (newWidth < 480) newWidth = 480;
        if (newHeight < 320) newHeight = 320;
        if (newWidth > window.innerWidth) newWidth = window.innerWidth;
        if (newHeight > window.innerHeight) newHeight = window.innerHeight;
        currentFlex.style.setProperty("width", newWidth + "px", "important");
        currentFlex.style.setProperty("height", newHeight + "px", "important");
        window.dispatchEvent(new Event("resize"));
      });

      function endResize(pointerEvent) {
        if (!resizing) return;
        resizing = false;
        if (resizeHandle.hasPointerCapture(pointerEvent.pointerId)) {
          resizeHandle.releasePointerCapture(pointerEvent.pointerId);
        }
        document.body.classList.remove("bph-resizing");
        var currentFlex = modalTop.querySelector(".flex_panel.packaged_components_wizard");
        if (currentFlex) {
          _pkgSavedWidth = currentFlex.offsetWidth;
          _pkgSavedHeight = currentFlex.offsetHeight;
          var popup = currentFlex.closest(".center_panel") || currentFlex.closest("#popup_on_popup_content");
          if (popup) {
            popup.style.left = ((window.innerWidth - currentFlex.offsetWidth) / 2) + "px";
            popup.style.top = ((window.innerHeight - currentFlex.offsetHeight) / 2) + "px";
          }
        }
        window.dispatchEvent(new Event("resize"));
      }

      resizeHandle.addEventListener("pointerup", endResize);
      resizeHandle.addEventListener("pointercancel", endResize);
    }
  },
);
