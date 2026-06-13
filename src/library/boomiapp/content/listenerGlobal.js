const add_dialog_listener = (dialog) => {
  if (!dialog.querySelector(".dialogTopCenterInner .Caption").innerText)
    return false;

  let rect = dialog.getBoundingClientRect();
  let children = [...dialog.getElementsByTagName("*")];
};

var BoomiPlatform = {};
let bt_init = false;

const BoomiPlatform_Init = () => {
  // load shape style settings
  dynamicShapeIconStyleData = "";
  if (BoomiPlatform.shape_icon_styling == "legacy") {
    dynamicShapeIconStyleData = legacyIconData;
  }
  if (BoomiPlatform.shape_icon_styling == "modern") {
    dynamicShapeIconStyleData = modernIconData;
  }
  if (BoomiPlatform.shape_icon_styling == "minimal") {
    if (
      window
        .getComputedStyle(document.body, null)
        .getPropertyValue("background-color") == "rgb(38, 38, 38)"
    ) {
      dynamicShapeIconStyleData = minimalDarkThemeIconData;
    } else {
      dynamicShapeIconStyleData = minimalLightThemeIconData;
    }
  }
  if (BoomiPlatform.shape_icon_styling == "minimal-inverted") {
    dynamicShapeIconStyleData = minimalInvertedIconStyleColorCodes;
  }
  if (BoomiPlatform.shape_icon_styling == "refreshed-inverted") {
    dynamicShapeIconStyleData = refreshedIconStyleColorCodes;
  }

  const dom_watcher = (() => {
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes) {
                mutation.addedNodes.forEach(node => {
                    try {
                        if (
                            typeof dynamicShapeIconStyleData == "object" &&
                            node &&
                            typeof node === "object" &&
                            node !== null &&
                            "querySelector" in node
                        ) {
                            setTimeout(() => {
                                var elem = node.querySelector(
                                    ".shape_palette_widget, .gwt-Shape",
                                );
                                if (elem) {
                                    var shapeName = elem.getElementsByTagName("img")[0].title;
                                    var shapeImageIcon = dynamicShapeIconStyleData[shapeName];
                                    if (shapeImageIcon) {
                                        var img = node.getElementsByTagName("img")[0];
                                        if (shapeImageIcon.charAt(0) != "#") {
                                            if (BoomiPlatform.shape_icon_styling !== "minimal") {
                                                img.style.setProperty("width", "32px", "important");
                                                img.style.setProperty("height", "32px", "important");
                                                img.style.setProperty(
                                                    "background-color",
                                                    "transparent",
                                                    "important",
                                                );

                                                elem.style.border = "0px";
                                                elem.style.borderRadius = "0px";
                                                elem.style.setProperty(
                                                    "background-color",
                                                    "transparent",
                                                    "important",
                                                );
                                            }
                                            img.src = shapeImageIcon;
                                        } else {
                                            img.style.setProperty("width", "24px", "important");
                                            img.style.setProperty("height", "24px", "important");
                                            img.style.setProperty(
                                                "filter",
                                                "none",
                                                "important",
                                            );
                                        }
                                    }
                                }
                            }, 0);
                        }

                        if(
                          node !== null &&
                          "querySelector" in node
                        ){
                          let noteForm = node.querySelector(".note-form");
                          if (!noteForm) return false;

                          notegroupbutton_html = `
                                <button type="button" class="NoteGroupButton" onclick="create_note_group(this)">Group</button>
                                `;
                          noteForm
                            .querySelector(".button_row")
                            .insertAdjacentHTML("beforeend", notegroupbutton_html);

                          if (
                            /\n{0,2}---\n\#BoomiPlatform: \[\"(\d*px)\"\,\"(\d*px)\"\,\"([a-z]*)\"\]/g.test(
                              noteForm.querySelector("textarea").value,
                            )
                          ) {
                            setTimeout(() => {
                              create_note_group(noteForm);
                            }, 100);
                          }
                        }
                    } catch (err) {
                        console.error(err);
                    }
                });
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
  })();

  const global_listeners = setInterval(() => {
    const listenerClass = (selector, callback) => {
      let elements = document.querySelectorAll(
        `${selector}:not(.bph-load-done)`,
      );
      if (elements.length) {
        [...elements].forEach((el) => {
          el.classList.add("bph-load-done");
          if (Array.isArray(callback)) {
            callback.forEach((cb) => {
              cb(el);
            });
          } else {
            callback(el);
          }
        });
      }
    };

    listenerClass(".modal_top", modal_listener);
    listenerClass(".gwt-ProcessPanel", [process_to_image, add_canvas_listener]);
    listenerClass(".gwt-EndPoint", add_endpoint_listener);
    listenerClass(".gwt-Shape", add_shape_listener);
    listenerClass(".gwt-connectors-svg", add_path_listener);
    listenerClass(".gwt-DialogBox", add_dialog_listener);
    listenerClass(".boomi_standard_table", add_table_listener);
    listenerClass(".build_actionsButton", add_fullscreen_listener);
    listenerClass(".note-content", add_notecontent_listener);
    listenerClass(".auto_refresh_li", refreshInterval_listener);
    listenerClass(".gwt-DetailAreaInner", add_connector_list);
    listenerClass(".buildMain", add_notification_close);
  }, 1000);
};

chrome.storage.sync.get(null, (config) => {
  BoomiPlatform = config;
  if (!bt_init) {
    bt_init = true;
    BoomiPlatform_Init();
  }
});

chrome.storage.onChanged.addListener((changes) => {
  for (const [key, { newValue }] of Object.entries(changes)) {
    BoomiPlatform[key] = newValue;
  }
});
