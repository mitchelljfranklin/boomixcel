# SELECTORS.md

Auto-generated reference of all CSS selectors, class names, `data-locator` values,
and `data-testid` attributes targeted by BoomiXcel content scripts.

Regenerate with: `node scripts/gen-selectors.js`

---

## Contents

- [Header / Navigation](#headernavigation)
- [Build Canvas](#build-canvas)
- [Process Reporting](#process-reporting)
- [Deploy Wizard](#deploy-wizard)
- [Show Log Dialog](#show-log-dialog)
- [Document Viewer](#document-viewer)
- [BoomiAI](#boomiai)
- [Filter Panel](#filter-panel)
- [Modals (shared)](#modals-shared)
- [Tables (shared)](#tables-shared)
- [Global](#global)
- [Other](#other)

## Header / Navigation

### Boomi platform native selectors

| Selector | Source |
|---|---|
| `header-masthead-brand-logo` | `brandLogo.js` |
| `.bph-masthead-options-item` | `contentScript.js` |
| `li` | `contentScript.js` |
| `footer_links` | `contentScript.js` |
| `mastfoot` | `contentScript.js` |
| `mastfoot-hidden` | `contentScript.js` |
| `product-switcher-button` | `contentScript.js` |
| `closeUpdate` | `contentScript.js` |
| `reloadPage` | `contentScript.js` |
| `BoomiUpdateOverlay` | `contentScript.js` |
| `link[data-bph-favicon]` | `favicon.js` |
| `.BoomiUpdateOverlay` | `headerActions.js` |
| `.bph-monitor-link` | `headerActions.js` |
| `.save_controls .closeButtonNew` | `headerActions.js` |
| `.lockandEditButtonNew` | `headerActions.js` |
| `gwt-Anchor svg-anchor bph-monitor-link` | `headerActions.js` |
| `link-process-reporting` | `headerActions.js` |
| `link-enter-full-screen` | `headerActions.js` |
| `link-description` | `headerActions.js` |
| `button-save` | `keyboardShortcuts.js` |
| `ex-menu-item[href]` | `menuOpen.js` |
| `.ex-menu-item--category` | `menuOpen.js` |
| `.svg-anchor` | `menuOpen.js` |
| `ex-menu-item-group[data-testid]` | `menuOpen.js` |
| `.qm-c-servicenav` | `menuOpen.js` |
| `li.SubNavigation-module_header__nav-item__dQn5K` | `menuOpen.js` |
| `gwt-Anchor svg-anchor qm-c-inlinemenu__descriptive-composite-menu-icon bph-open-tab` | `menuOpen.js` |
| `.qm-c-inlinemenu__menu-link` | `menuOpen.js` |
| `no_display` | `pageInit.js` |
| `header-masthead-brand-logo` | `updateNotification.js` |
| `closeUpdate` | `updateNotification.js` |
| `BoomiUpdateOverlay` | `updateNotification.js` |
| `.component_header` | `versionNotification.js` |
| `.qm-c-servicenav` | `boomi.css` |
| `.headerShow` | `boomi.css` |
| `.information_label_content` | `boomi.css` |
| `.mastfoot .footer_msg` | `boomi.css` |
| `.boomimenuOpen` | `boomi.css` |

### BoomiXcel-added classes (`bph-*` / `bpe-*`)

| Class | Source |
|---|---|
| `bph-brand-logo` | `brandLogo.js` |
| `bph-masthead-options-item` | `contentScript.js` |
| `bph-masthead-options-link` | `contentScript.js` |
| `#bph-group-style` | `menuOpen.js` |
| `#bph-item-style` | `menuOpen.js` |
| `bph-active` | `menuOpen.js` |
| `bph-close-notification` | `versionNotification.js` |
| `bph-brand-logo` | `boomi.css` |
| `bph-masthead-options-item` | `boomi.css` |
| `bph-masthead-options-link` | `boomi.css` |
| `bph-masthead-options-link:hover` | `boomi.css` |
| `bph-masthead-options-link svg` | `boomi.css` |
| `bph-status-dot` | `boomi.css` |
| `bph-close-notification` | `boomi.css` |
| `bph-close-notification:hover` | `boomi.css` |
| `bph-close-notification svg` | `boomi.css` |

---

## Build Canvas

### Boomi platform native selectors

| Selector | Source |
|---|---|
| `hide_canvas_grid` | `canvas.js` |
| `boomiConnect` | `connectionOperations.js` |
| `connectorText` | `connectionOperations.js` |
| `connectorVal` | `connectionOperations.js` |
| `formrow-enter-name-here` | `copyComponentDefaults.js` |
| `formrow-component-to-copy` | `copyComponentDefaults.js` |
| `formrow-copy-passwords-across-all-accounts-input` | `copyComponentDefaults.js` |
| `formrow-copy-component-dependents-input` | `copyComponentDefaults.js` |
| `.bph-copy-property` | `copySetProperty.js` |
| `title` | `copySetProperty.js` |
| `tr.selected .gwt-DataListItem:not(.parameter_value_list_item)` | `copySetProperty.js` |
| `.parameter_value_list_item .parameter_value` | `copySetProperty.js` |
| `.mock_form_label` | `copySetProperty.js` |
| `gwt-Anchor svg-anchor floatLeft buttonSpacer bph-copy-property` | `copySetProperty.js` |
| `link-edit` | `copySetProperty.js` |
| `formrow-language` | `defaultScriptingLanguage.js` |
| `.bph-stop` | `endpointGlow.js` |
| `.base_shape_container` | `endpointGlow.js` |
| `.gwt-Label` | `endpointGlow.js` |
| `.shape_side_panel .form_title_label` | `endpointGlow.js` |
| `.glass_standard` | `endpointGlow.js` |
| `button-ok` | `endpointGlow.js` |
| `.step_pellete` | `imageCapture.js` |
| `.bph-capture-process` | `imageCapture.js` |
| `.BoomiPlatformOverlay` | `imageCapture.js` |
| `.BoomiPlatformOverlay button.action_button` | `imageCapture.js` |
| `.BoomiPlatformOverlay .transparent` | `imageCapture.js` |
| `.BoomiPlatformOverlay .uiscale` | `imageCapture.js` |
| `.component_header .name_label` | `imageCapture.js` |
| `.BoomiPlatformEndpointMenu` | `imageCapture.js` |
| `.note-preview` | `imageCapture.js` |
| `output-process-image` | `imageCapture.js` |
| `capture-process-flow` | `imageCapture.js` |
| `link-cancel` | `imageCapture.js` |
| `BoomiPlatformOverlay` | `imageCapture.js` |
| `.flex_panel_message_editor` | `messageEditor.js` |
| `.bpe-editor-resize-handle` | `messageEditor.js` |
| `formrow-message` | `messageEditor.js` |
| `body` | `messageEditor.js` |
| `#bpe-message-editor` | `messageEditor.js` |
| `#bpe-message-editor-language` | `messageEditor.js` |
| `#bpe-message-editor-ok` | `messageEditor.js` |
| `#popup_on_popup_content, #popup_on_popup` | `messageEditor.js` |
| `#bpe-message-editor-cancel` | `messageEditor.js` |
| `.bpe-editor-resize-handle` | `nativeEditorResize.js` |
| `.flex_panel` | `nativeEditorResize.js` |
| `.modal_top` | `nativeEditorResize.js` |
| `#popup_on_popup_content_InlineScriptEditorPanel` | `nativeEditorResize.js` |
| `.bpe-editor-resize-handle` | `packagedComponentsResize.js` |
| `.flex_panel.packaged_components_wizard` | `packagedComponentsResize.js` |
| `.step_pellete` | `setPropertiesExtractor.js` |
| `.bph-extract-setproperties` | `setPropertiesExtractor.js` |
| `.gwt-DataList > tbody .gwt-DataListItem` | `setPropertiesExtractor.js` |
| `.gwt-DataList > tbody tr` | `setPropertiesExtractor.js` |
| `td` | `setPropertiesExtractor.js` |
| `.parameter_value_list_item .parameter_value` | `setPropertiesExtractor.js` |
| `.BoomiPlatformOverlay` | `setPropertiesExtractor.js` |
| `dragdrop-selected` | `setPropertiesExtractor.js` |
| `selected` | `setPropertiesExtractor.js` |
| `extract-set-properties` | `setPropertiesExtractor.js` |
| `formrow-display-name` | `setPropertiesExtractor.js` |
| `button-cancel` | `setPropertiesExtractor.js` |
| `link-cancel` | `setPropertiesExtractor.js` |
| `BoomiPlatformOverlay` | `setPropertiesExtractor.js` |
| `.testModeCover` | `shapePopup.js` |
| `.gwt-ProcessPanel` | `shapePopup.js` |
| `${shape[0]}` | `shapePopup.js` |
| `icon-arrows-cw` | `shapePopup.js` |
| `.bpe-quickshape-shape` | `shapePopup.js` |
| `.bpe-quickshape-popup` | `shapePopup.js` |
| `.copy_paste_panel` | `shapePopup.js` |
| `.gwt-Label.base_shape_container_label` | `shapePopup.js` |
| `#bpe-quickshape-input` | `shapePopup.js` |
| `.component_list` | `shapePopup.js` |
| `.gwt-Image:not([title])` | `shapes.js` |
| `.gwt-connectors-path-connected` | `shapes.js` |
| `.gwt-connectors-path-connected:not(.BoomiPlatform-linetrace)` | `shapes.js` |
| `BoomiPlatform-linetrace` | `shapes.js` |
| `BoomiPlatform-lineparent` | `shapes.js` |
| `BoomiPlatform-linetrace-active` | `shapes.js` |
| `BoomiPlatform-linetrace-active-dash` | `shapes.js` |
| `formrow-sql` | `sqlEditor.js` |
| `button-edit-sql` | `sqlEditor.js` |
| `formrow-sql-query` | `sqlEditor.js` |
| `body` | `sqlEditor.js` |
| `#bpe-message-editor` | `sqlEditor.js` |
| `#bpe-message-editor-ok` | `sqlEditor.js` |
| `#popup_on_popup_content, #popup_on_popup` | `sqlEditor.js` |
| `#bpe-message-editor-cancel` | `sqlEditor.js` |
| `#bpe-message-editor-language` | `sqlEditor.js` |
| `.canvas_grid` | `boomi.css` |
| `.greenGlow` | `boomi.css` |
| `.redGlow` | `boomi.css` |
| `.yellowGlow` | `boomi.css` |
| `.yellowGlow img:not([title])` | `boomi.css` |
| `.gwt-TestFocused` | `boomi.css` |
| `.gwt-TestFocused::after` | `boomi.css` |
| `.disconnected::after` | `boomi.css` |
| `.testModeBack .bph-endpoint-flash-testonly.disconnected::after` | `boomi.css` |
| `.gwt-EndPoint .BoomiPlatformEndpointMenu` | `boomi.css` |
| `.BoomiPlatformEndpointMenu:hover` | `boomi.css` |
| `.BoomiPlatformEndpointMenu::before` | `boomi.css` |
| `.BoomiPlatformEndpointMenu .gwt-ClickableLabel` | `boomi.css` |
| `.BoomiPlatformEndpointMenu .gwt-ClickableLabel:hover` | `boomi.css` |
| `.BoomiPlatform_showconnections` | `boomi.css` |
| `.gwt-connectors-line` | `boomi.css` |
| `.BoomiPlatform-lineparent` | `boomi.css` |
| `.BoomiPlatform-linetrace` | `boomi.css` |
| `.BoomiPlatform-linetrace-active-solid` | `boomi.css` |
| `.BoomiPlatform-linetrace-active-pulse` | `boomi.css` |
| `.BoomiPlatform-linetrace-active-dash` | `boomi.css` |
| `.shape_palette_widget .gwt-Image[title]:not([title="Note"])` | `boomi.css` |
| `.component_header .description_panel>p` | `boomi.css` |
| `.component_header .description_panel textarea` | `boomi.css` |
| `.hide_canvas_grid` | `boomi.css` |
| `.component_header .name_label>.gwt-Label` | `boomi.css` |
| `.gwt-ParamPopup` | `boomi.css` |
| `.boomiDown` | `boomi.css` |
| `.boomiConnect` | `boomi.css` |
| `.openimage` | `boomi.css` |
| `.connectorText` | `boomi.css` |
| `.connectorVal` | `boomi.css` |
| `.flex_panel_sql` | `boomi.css` |
| `.new_shape_chooser_popup .category_row_hover_style:hover` | `boomi.css` |
| `.new_shape_chooser_popup .category_row_hover_style:focus` | `boomi.css` |
| `.flex_panel_message_editor` | `boomi.css` |
| `.inline_script_editor_header` | `boomi.css` |
| `.inline_script_editor_settings_row` | `boomi.css` |
| `.inline_script_editor_body` | `boomi.css` |
| `.inline_script_editor_code_container` | `boomi.css` |
| `html.qm-u-theme-dark .bpe-setprops-table tbody tr:hover` | `boomi.css` |

### BoomiXcel-added classes (`bph-*` / `bpe-*`)

| Class | Source |
|---|---|
| `bph-copyprop-item` | `copySetProperty.js` |
| `bph-copy-fallback-textarea` | `copySetProperty.js` |
| `bph-endpoint-flash-testonly` | `endpointGlow.js` |
| `bph-endpoint-flash` | `endpointGlow.js` |
| `bph-resizing` | `messageEditor.js` |
| `bpe-editor-modal` | `nativeEditorResize.js` |
| `bph-resizing` | `nativeEditorResize.js` |
| `bpe-editor-resize-handle` | `nativeEditorResize.js` |
| `bpe-editor-modal` | `packagedComponentsResize.js` |
| `bph-resizing` | `packagedComponentsResize.js` |
| `bpe-editor-resize-handle` | `packagedComponentsResize.js` |
| `bpe-setprops-export-btn` | `setPropertiesExtractor.js` |
| `bph-extracting` | `setPropertiesExtractor.js` |
| `bph-sql-query-done` | `sqlEditor.js` |
| `bph-resizing` | `sqlEditor.js` |
| `bph-sql-resize-handle` | `sqlEditor.js` |
| `bph-endpoint-flash.disconnected::after` | `boomi.css` |
| `bph-shape-handler:after` | `boomi.css` |
| `bph-copy-btn` | `boomi.css` |
| `bph-collapse-btn` | `boomi.css` |
| `bph-collapse-btn:hover` | `boomi.css` |
| `bph-collapse-btn .collapse-icon` | `boomi.css` |
| `bph-monitor-link` | `boomi.css` |
| `bph-monitor-link:hover` | `boomi.css` |
| `bph-monitor-link svg` | `boomi.css` |
| `bph-capture-options` | `boomi.css` |
| `bph-capture-toggle-row` | `boomi.css` |
| `bph-capture-toggle-row span` | `boomi.css` |
| `bph-capture-scale` | `boomi.css` |
| `bpe-shape-icon` | `boomi.css` |
| `bpe-editor-modal` | `boomi.css` |
| `bpe-editor-resize-handle` | `boomi.css` |
| `bph-sql-resize-container` | `boomi.css` |
| `bpe-sql-query-button` | `boomi.css` |
| `bph-sql-resize-handle` | `boomi.css` |
| `bpe-setprops-modal .qm-c-alert` | `boomi.css` |
| `bpe-setprops-body` | `boomi.css` |
| `bpe-setprops-container` | `boomi.css` |
| `bpe-setprops-table` | `boomi.css` |
| `bpe-setprops-table thead` | `boomi.css` |
| `bpe-setprops-table thead th` | `boomi.css` |
| `bpe-setprops-table tbody td` | `boomi.css` |
| `bpe-setprops-table tbody tr:hover` | `boomi.css` |
| `bpe-setprops-footer` | `boomi.css` |
| `bpe-setprops-count` | `boomi.css` |
| `bph-extract-setproperties` | `boomi.css` |
| `bph-extract-setproperties.bph-extracting` | `boomi.css` |
| `bpe-setprops-table td.bpe-setprops-duplicate` | `boomi.css` |
| `bph-copy-property svg` | `boomi.css` |
| `bph-copyprop-menu` | `boomi.css` |
| `bph-copyprop-item` | `boomi.css` |
| `bph-copyprop-item:hover` | `boomi.css` |
| `bph-copy-fallback-textarea` | `boomi.css` |

---

## Process Reporting

### Boomi platform native selectors

| Selector | Source |
|---|---|
| `#refresh_reporting .refresh-label` | `customRefresh.js` |
| `button[data-locator=button-refresh]` | `customRefresh.js` |
| `#refresh_reporting button` | `customRefresh.js` |
| `.refresh-label` | `customRefresh.js` |
| `refresh_reporting` | `customRefresh.js` |
| `refresh_pulse` | `customRefresh.js` |
| `refresh_primary_action` | `customRefresh.js` |
| `refresh_doing_action` | `customRefresh.js` |
| `.reporting_right_side` | `customRefresh.js` |
| `label` | `processDuration.js` |
| `div` | `processDuration.js` |
| `.deployed_processes_panel` | `scheduleIcons.js` |
| `.gwt-Label[title]` | `viewInReporting.js` |
| `.context_menu .menu_item_group` | `viewInReporting.js` |
| `.bph-reporting-item` | `viewInReporting.js` |
| `.filter_input.uneditable_text` | `viewInReporting.js` |
| `link` | `viewInReporting.js` |
| `link-execute-process` | `viewInReporting.js` |
| `button-add-filter` | `viewInReporting.js` |
| `link-process` | `viewInReporting.js` |
| `button-apply` | `viewInReporting.js` |
| `.reporting-type-menu` | `boomi.css` |
| `.reporting-tab .header .reporting_right_side` | `boomi.css` |
| `#refresh_reporting button` | `boomi.css` |
| `#refresh_reporting button .refresh-icon` | `boomi.css` |
| `#refresh_reporting button .refresh-label` | `boomi.css` |
| `.refresh_primary_action` | `boomi.css` |
| `.refresh_primary_action:hover` | `boomi.css` |
| `.refresh_doing_action` | `boomi.css` |
| `.refresh_doing_action:hover` | `boomi.css` |
| `.refresh_pulse` | `boomi.css` |

### BoomiXcel-added classes (`bph-*` / `bpe-*`)

| Class | Source |
|---|---|
| `bph-processing-row` | `processDuration.js` |
| `bph-elapsed-badge` | `processDuration.js` |
| `bph-elapsed-tick` | `processDuration.js` |
| `bph-reporting-separator` | `viewInReporting.js` |
| `bph-reporting-item` | `viewInReporting.js` |
| `bph-processing-row` | `boomi.css` |
| `bph-elapsed-badge` | `boomi.css` |
| `bph-elapsed-active` | `boomi.css` |
| `bph-elapsed-tick` | `boomi.css` |
| `bph-reporting-separator` | `boomi.css` |
| `bph-reporting-item a` | `boomi.css` |
| `bph-reporting-icon` | `boomi.css` |

---

## Deploy Wizard

### Boomi platform native selectors

| Selector | Source |
|---|---|
| `textarea` | `deploymentNotes.js` |
| `.packaged_component_panel` | `deploymentNotes.js` |
| `tr.GPGODNGDAJ` | `deploymentNotes.js` |
| `.boomi_standard_table table` | `deploymentNotes.js` |
| `th` | `deploymentNotes.js` |
| `div[__gwt_header]` | `deploymentNotes.js` |
| `td` | `deploymentNotes.js` |
| `div[__gwt_cell]` | `deploymentNotes.js` |
| `button-create-packaged-component-1` | `deploymentNotes.js` |
| `formrow-package-notes-for-all` | `deploymentNotes.js` |
| `link-deploy` | `deploymentNotes.js` |
| `formrow-deployment-notes` | `deploymentNotes.js` |
| `button-view-deployments` | `reminders.js` |
| `.boomi_standard_table` | `runProcessFromDeployment.js` |
| `.GPGODNGDPL table tbody` | `runProcessFromDeployment.js` |
| `table tbody` | `runProcessFromDeployment.js` |
| `tr[__gwt_row]` | `runProcessFromDeployment.js` |
| `td` | `runProcessFromDeployment.js` |
| `.bph-run-deploy-now` | `runProcessFromDeployment.js` |
| `h2.form_title_label` | `runProcessFromDeployment.js` |
| `.button_set` | `runProcessFromDeployment.js` |
| `.BoomiPlatformOverlay` | `runProcessFromDeployment.js` |
| `deploy_review_screen` | `runProcessFromDeployment.js` |
| `popup_on_popup_content_TopModalMessageWidget` | `runProcessFromDeployment.js` |
| `popup_on_popup_content_WizardControllerPanel` | `runProcessFromDeployment.js` |
| `gwt-Button qm-button--primary-action bph-run-deploy-now` | `runProcessFromDeployment.js` |
| `button-next-select-versions` | `runProcessFromDeployment.js` |
| `formrow-deployment-environment` | `runProcessFromDeployment.js` |
| `link-process-reporting` | `runProcessFromDeployment.js` |
| `cell-` | `runProcessFromDeployment.js` |
| `BoomiPlatformOverlay` | `runProcessFromDeployment.js` |

### BoomiXcel-added classes (`bph-*` / `bpe-*`)

| Class | Source |
|---|---|
| `bph-deploy-notes-done` | `deploymentNotes.js` |
| `bph-run-confirm-ok` | `runProcessFromDeployment.js` |
| `bph-reminder-badge` | `boomi.css` |

---

## Show Log Dialog

### Boomi platform native selectors

| Selector | Source |
|---|---|
| `#popup_on_popup_content_LogDialogContents .filterContainer select.gwt-ListBox:not(.bph-log-status-applied)` | `logDefaultStatus.js` |
| `thead th` | `logHighlight.js` |
| `tbody tr[__gwt_row]` | `logHighlight.js` |
| `td` | `logHighlight.js` |
| `#popup_on_popup_content_LogDialogContents .boomi_standard_table.paging_data_panel` | `logHighlight.js` |
| `html.qm-u-theme-dark .center_panel.showLogNew tr.bph-log-warning td div` | `boomi.css` |

### BoomiXcel-added classes (`bph-*` / `bpe-*`)

| Class | Source |
|---|---|
| `bph-log-status-applied` | `logDefaultStatus.js` |
| `bph-log-warning` | `logHighlight.js` |

---

## Document Viewer

### Boomi platform native selectors

| Selector | Source |
|---|---|
| `.form_header` | `copyDocument.js` |
| `.documentViewer textarea.gwt-TextArea` | `copyDocument.js` |
| `popup_on_popup_content_DocumentDialogContents` | `copyDocument.js` |
| `link-download-original-document` | `copyDocument.js` |
| `textarea.gwt-TextArea` | `documentViewer.js` |
| `.dbview-controls` | `documentViewer.js` |
| `.documentViewer` | `documentViewer.js` |
| `popup_on_popup_content_DocumentDialogContents` | `documentViewer.js` |
| `dbview-sorted` | `documentViewer.js` |
| `dbview-maximized` | `documentViewer.js` |
| `dbview-maximize-hidden` | `documentViewer.js` |
| `dbview-search` | `documentViewer.js` |
| `dbview-table-wrapper` | `documentViewer.js` |
| `dbview-pagination` | `documentViewer.js` |
| `dbview-page-btn` | `documentViewer.js` |
| `dbview-page-info` | `documentViewer.js` |
| `dbview-table` | `documentViewer.js` |
| `dbview-sort-arrow` | `documentViewer.js` |
| `dbview-controls` | `documentViewer.js` |
| `dbview-toggle-row` | `documentViewer.js` |
| `toggle toggle-sm` | `documentViewer.js` |
| `slider` | `documentViewer.js` |
| `dbview-maximize-btn dbview-maximize-hidden` | `documentViewer.js` |
| `link-download-original-document` | `documentViewer.js` |
| `.property_list dt` | `downloadRename.js` |
| `.gwt-TabLayoutPanelTab-selected .build_closeable_tab_widget` | `downloadRename.js` |
| `.form_title_label:not(.no_display)` | `downloadRename.js` |
| `.documentViewer textarea.gwt-TextArea` | `downloadRename.js` |
| `popup_on_popup_content_DocumentDialogContents` | `downloadRename.js` |
| `link-download-original-document` | `downloadRename.js` |
| `link-process-` | `downloadRename.js` |
| `#popup_on_popup_content_DocumentDialogContents .modal_contents .margin_popup_contents .documentViewer .gwt-TextArea` | `boomi.css` |
| `.popupContent .modal_contents .margin_popup_contents .documentViewer .gwt-TextArea` | `boomi.css` |
| `.dbview-controls` | `boomi.css` |
| `.dbview-toggle-row` | `boomi.css` |
| `.dbview-maximize-btn` | `boomi.css` |
| `.dbview-maximize-btn:hover` | `boomi.css` |
| `.dbview-maximize-btn:focus` | `boomi.css` |
| `.dbview-maximize-btn:focus-visible` | `boomi.css` |
| `.dbview-maximize-hidden` | `boomi.css` |
| `.dbview-maximize-btn svg` | `boomi.css` |
| `.dbview-maximized` | `boomi.css` |
| `.dbview-table` | `boomi.css` |
| `.dbview-table th` | `boomi.css` |
| `.dbview-table th:hover` | `boomi.css` |
| `.dbview-table th.dbview-sorted` | `boomi.css` |
| `.dbview-table th .dbview-sort-arrow` | `boomi.css` |
| `.dbview-table td` | `boomi.css` |
| `.dbview-table tr:hover td` | `boomi.css` |
| `.dbview-search` | `boomi.css` |
| `.dbview-search:focus` | `boomi.css` |
| `.dbview-pagination` | `boomi.css` |
| `.dbview-page-btn` | `boomi.css` |
| `.dbview-page-btn:disabled` | `boomi.css` |
| `.dbview-page-btn:not(:disabled):hover` | `boomi.css` |
| `.dbview-page-info` | `boomi.css` |
| `html.qm-u-theme-dark .dbview-table th` | `boomi.css` |
| `html.qm-u-theme-dark .dbview-table th:hover` | `boomi.css` |
| `html.qm-u-theme-dark .dbview-table th.dbview-sorted` | `boomi.css` |
| `html.qm-u-theme-dark .dbview-table td` | `boomi.css` |
| `html.qm-u-theme-dark .dbview-table tr:hover td` | `boomi.css` |
| `html.qm-u-theme-dark .dbview-search` | `boomi.css` |
| `html.qm-u-theme-dark .dbview-search:focus` | `boomi.css` |
| `html.qm-u-theme-dark .dbview-page-btn` | `boomi.css` |
| `html.qm-u-theme-dark .dbview-page-btn:not(:disabled):hover` | `boomi.css` |
| `html.qm-u-theme-dark .dbview-page-info` | `boomi.css` |
| `.dbview-maximized .documentViewer.secondary` | `boomi.css` |
| `.dbview-table-wrapper` | `boomi.css` |

### BoomiXcel-added classes (`bph-*` / `bpe-*`)

| Class | Source |
|---|---|
| `bph-copy-btn-hover` | `copyDocument.js` |
| `bph-copy-tooltip-visible` | `copyDocument.js` |
| `bph-copy-tooltip` | `copyDocument.js` |

---

## BoomiAI

### Boomi platform native selectors

| Selector | Source |
|---|---|
| `.headerTable tbody tr` | `boomiGpt.js` |
| `td` | `boomiGpt.js` |
| `.bph-rev-checkbox:checked` | `boomiGpt.js` |
| `.boomiGptPanel label a, .boomiGptPanel a` | `boomiGpt.js` |
| `.bph-gpt-using` | `boomiGpt.js` |
| `.dataTable tbody tr` | `boomiGpt.js` |
| `.gwt-HistoryPopup` | `boomiGpt.js` |
| `formrow-component-id` | `boomiGpt.js` |
| `boomi-gpt-chat-send-button` | `boomiGpt.js` |

### BoomiXcel-added classes (`bph-*` / `bpe-*`)

| Class | Source |
|---|---|
| `bph-gpt-link-active` | `boomiGpt.js` |
| `bph-rev-hooked` | `boomiGpt.js` |
| `bph-rev-checkbox` | `boomiGpt.js` |
| `bph-rev-selected` | `boomiGpt.js` |
| `bph-gpt-using` | `boomiGpt.js` |
| `bph-rev-checkbox` | `boomi.css` |
| `bph-rev-selected` | `boomi.css` |
| `bph-rev-hooked .gwt-ScrollTable` | `boomi.css` |
| `bph-gpt-link-active` | `boomi.css` |

---

## Filter Panel

### Boomi platform native selectors

| Selector | Source |
|---|---|
| `link` | `buildFilters.js` |
| `.filterable_tree_loading_container` | `filterButtons.js` |
| `.open` | `filterButtons.js` |
| `.closed,.open` | `filterButtons.js` |
| `.filter_panel_dialog_popup_panel` | `filterButtons.js` |
| `.rail.simplify .gwt-FastTree .treeItemContent` | `filterButtons.js` |
| `children` | `filterButtons.js` |
| `button-schedules` | `filterButtons.js` |
| `.rail.simplify .gwt-FastTreeItem .treeItemContent` | `boomi.css` |
| `.rail.simplify .gwt-FastTreeItem .children .treeItemContent` | `boomi.css` |
| `.rail.simplify .gwt-FastTreeItem.gwt-FastTreeItem-leaf` | `boomi.css` |
| `.gwt-TreeRightAlign .gwt-FastTreeItem-leaf` | `boomi.css` |

---

## Modals (shared)

### Boomi platform native selectors

| Selector | Source |
|---|---|
| `.button_set` | `modalButtons.js` |
| `okBtn` | `modalHelper.js` |
| `cancelBtn` | `modalHelper.js` |
| `BoomiUpdateOverlay` | `modalHelper.js` |
| `show` | `toastHelper.js` |
| `.center_panel.BoomiUpdateOverlay` | `boomi.css` |

### BoomiXcel-added classes (`bph-*` / `bpe-*`)

| Class | Source |
|---|---|
| `bph-toast-container` | `toastHelper.js` |
| `bph-toast-error` | `toastHelper.js` |
| `bph-toast` | `toastHelper.js` |
| `bph-modern-modal .popupContent` | `boomi.css` |
| `bph-modern-modal .form_header` | `boomi.css` |
| `bph-modern-modal .qm-c-alert` | `boomi.css` |
| `bph-modern-modal .button_set` | `boomi.css` |

---

## Tables (shared)

### Boomi platform native selectors

| Selector | Source |
|---|---|
| `thead` | `tableWrap.js` |
| `.bph-thead-menu` | `tableWrap.js` |
| `.bph-thead-menu .toggle_word_wrap` | `tableWrap.js` |
| `wrapped_text_column_style` | `tableWrap.js` |

### BoomiXcel-added classes (`bph-*` / `bpe-*`)

| Class | Source |
|---|---|
| `bph-table-wrapped` | `tableWrap.js` |
| `bph-wrap` | `tableWrap.js` |
| `bph-wrap span.ignoreBreaks` | `boomi.css` |
| `bph-thead-menu` | `boomi.css` |

---

## Global

### Boomi platform native selectors

| Selector | Source |
|---|---|
| `.time_range_selector` | `global.js` |
| `.context_menu` | `global.js` |
| `.context_menu_glass` | `global.js` |
| `html` | `global.js` |
| `.dialogTopCenterInner .Caption` | `listenerGlobal.js` |
| `.shape_palette_widget, .gwt-Shape` | `listenerGlobal.js` |
| `${selector}:not(.bph-load-done)` | `listenerGlobal.js` |
| `body.bph-resizing` | `boomi.css` |

### BoomiXcel-added classes (`bph-*` / `bpe-*`)

| Class | Source |
|---|---|
| `bph-load-done` | `listenerGlobal.js` |

---

## Other

### Boomi platform native selectors

| Selector | Source |
|---|---|
| `br` | `copyXml.js` |
| `.form_title_label:not(.no_display)` | `copyXml.js` |
| `.form_header` | `copyXml.js` |
| `div.gwt-HTML` | `copyXml.js` |
| `.hover-menu-hidden-hotspot.left-arrow::after` | `boomi.css` |
| `.connectionsspanlink` | `boomi.css` |
| `.connectionsspanlink:hover` | `boomi.css` |
| `.closeall_doing_action` | `boomi.css` |
| `div[style*="position: relative; height: 250px; width: 250px;"]` | `boomi.css` |
| `.gwt-TextBox[maxlength='255']` | `boomi.css` |
| `.boomiHTTPReminder` | `boomi.css` |
| `.testRunDialog input[type='text']` | `boomi.css` |
| `.qm-button--primary-savetest` | `boomi.css` |
| `.toggle.toggle-sm` | `boomi.css` |
| `.toggle.toggle-sm .slider::before` | `boomi.css` |
| `.toggle.toggle-sm input:checked + .slider::before` | `boomi.css` |
| `.functionViewInputLabel` | `boomi.css` |
| `.functionViewOutputLabel` | `boomi.css` |

### BoomiXcel-added classes (`bph-*` / `bpe-*`)

| Class | Source |
|---|---|
| `bph-copy-tooltip` | `boomi.css` |

---
