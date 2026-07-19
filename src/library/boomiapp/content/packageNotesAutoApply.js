setInterval(function () {
  if (BoomiPlatform.package_notes_auto_apply !== "on") return;

  var textarea = document.querySelector(
    "[data-locator='formrow-package-notes-for-all']",
  );
  if (!textarea) return;
  if (textarea.dataset.bphPackageNotesFilled) return;

  var firstRow = document.querySelector(
    ".boomi_standard_table tbody tr",
  );
  if (!firstRow) return;

  // Find "Latest Notes" column index from header
  var headerCells = document.querySelectorAll(
    ".boomi_standard_table thead th",
  );
  var notesColIndex = -1;
  for (var i = 0; i < headerCells.length; i++) {
    if (headerCells[i].textContent.trim() === "Latest Notes") {
      notesColIndex = i;
      break;
    }
  }
  if (notesColIndex === -1) return;

  var cells = firstRow.querySelectorAll("td");
  var notesCell = cells[notesColIndex];
  if (!notesCell) return;

  var notesText = notesCell.textContent.trim();
  if (!notesText || notesText === "None") return;

  textarea.value = notesText;
  textarea.focus();
  textarea.blur();
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
  textarea.dispatchEvent(new Event("change", { bubbles: true }));
  textarea.dataset.bphPackageNotesFilled = "1";
}, 500);
