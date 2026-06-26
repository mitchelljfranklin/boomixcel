function getLogLevelColumnIndex(grid) {
  var headerCells = grid.querySelectorAll("thead th");
  for (var i = 0; i < headerCells.length; i++) {
    if (headerCells[i].textContent.trim().toUpperCase() === "LEVEL") {
      return i;
    }
  }
  return 1;
}

function highlightLogWarnings(grid, levelColumnIndex) {
  var rows = grid.querySelectorAll("tbody tr[__gwt_row]");
  rows.forEach(function (row) {
    var cells = row.querySelectorAll("td");
    var levelCell = cells[levelColumnIndex];
    var isWarning =
      !!levelCell && levelCell.textContent.trim().toUpperCase() === "WARNING";
    row.classList.toggle("bph-log-warning", isWarning);
  });
}

setInterval(function () {
  if (BoomiPlatform.log_highlight_warnings === "off") return;

  var grid = document.querySelector(
    "#popup_on_popup_content_LogDialogContents .boomi_standard_table.paging_data_panel",
  );
  if (!grid) return;

  var levelColumnIndex = getLogLevelColumnIndex(grid);
  highlightLogWarnings(grid, levelColumnIndex);
}, 1000);
