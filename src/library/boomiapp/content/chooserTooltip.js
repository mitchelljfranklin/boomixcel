// chooserTooltip.js — show full text on hover for truncated chooser inputs
document.addEventListener("mouseover", function (event) {
  var input = event.target.closest(".gwt-TextBox-readonly");
  if (!input) return;
  if (input.value && input.getAttribute("title") !== input.value) {
    input.setAttribute("title", input.value);
  }
}, true);
