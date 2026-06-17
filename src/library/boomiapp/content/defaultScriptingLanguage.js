var stripWhitespace = function (text) {
  return text.replace(/\u00a0/g, " ").replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\s+/g, "");
};

var GROOVY_SKELETON = stripWhitespace("import java.util.Properties;\nimport java.io.InputStream;\n\nfor( int i = 0; i < dataContext.getDataCount(); i++ ) {\n    InputStream is = dataContext.getStream(i);\n    Properties props = dataContext.getProperties(i);\n\n    dataContext.storeStream(is, props);\n}");

var JS_SKELETON = stripWhitespace("for( var i = 0; i < dataContext.getDataCount(); i++ ) {\n    var is = dataContext.getStream(i);\n    var props = dataContext.getProperties(i);\n    dataContext.storeStream(is, props);\n}");

var EDITOR_SELECTOR = ".ace_text-layer, .gwt-TextArea";

var onEditorArrive = function (editor) {
  setTimeout(function () {
    processEditor(editor);
  }, 100);
};

var existingEditors = document.querySelectorAll(EDITOR_SELECTOR);
for (var ei = 0; ei < existingEditors.length; ei++) {
  onEditorArrive(existingEditors[ei]);
}

document.arrive(EDITOR_SELECTOR, onEditorArrive);

var findScriptingSelect = function (editor) {
  var ancestor = editor;
  while (ancestor && ancestor !== document.body) {
    var select = ancestor.querySelector('select[data-locator="formrow-language"]');
    if (select) return select;
    ancestor = ancestor.parentElement;
  }
  return null;
};

var changeScriptingLanguage = function (select, targetLanguage) {
  for (var j = 0; j < select.options.length; j++) {
    var optionText = select.options[j].text;
    var optionValue = select.options[j].value;
    if (optionText === targetLanguage || optionValue === targetLanguage) {
      select.value = optionValue;
      select.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    }
  }
  return false;
};

var processEditor = function (editor) {
  var panel = editor.closest(".component_editor_panel");
  var popupContainer = editor.closest(".popupContent");
  if ((panel && panel._bphScriptLangApplied) || (popupContainer && popupContainer._bphScriptLangApplied)) return;
  if (editor._bphScriptLangApplied) return;

  var markProcessed = function () {
    if (panel) {
      panel._bphScriptLangApplied = true;
    } else if (popupContainer) {
      popupContainer._bphScriptLangApplied = true;
    }
    editor._bphScriptLangApplied = true;
  };

  if (!BoomiPlatform.default_scripting_language || BoomiPlatform.default_scripting_language === "off") {
    markProcessed();
    return;
  }

  var rawText = editor.textContent;
  var skeleton = stripWhitespace(rawText);

  if (skeleton === "") {
    var select = findScriptingSelect(editor);
    if (!select) {
      markProcessed();
      return;
    }
    var currentValue = select.options[select.selectedIndex].text;
    if (currentValue !== BoomiPlatform.default_scripting_language) {
      changeScriptingLanguage(select, BoomiPlatform.default_scripting_language);
    }
    markProcessed();
    return;
  }

  var currentLanguage = null;
  if (skeleton === GROOVY_SKELETON) {
    currentLanguage = "groovy";
  } else if (skeleton === JS_SKELETON) {
    currentLanguage = "javascript";
  }

  if (currentLanguage === null) {
    markProcessed();
    return;
  }

  var select = findScriptingSelect(editor);
  if (!select) {
    markProcessed();
    return;
  }

  var currentValue = select.options[select.selectedIndex].text;

  if (currentValue !== BoomiPlatform.default_scripting_language) {
    changeScriptingLanguage(select, BoomiPlatform.default_scripting_language);
  }

  markProcessed();
};
