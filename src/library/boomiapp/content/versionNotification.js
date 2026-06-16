var add_notification_close = (boomirevision) => {
  setTimeout(() => {
    let notipanel = document.getElementsByClassName("buildMain");

    for (var index = 0; index < notipanel.length; index++) {
      var notinav = notipanel[index].children[1].lastChild.innerHTML.includes(
        "This view corresponds to revision",
      );
      if (notinav) {
        notipanel[index].children[1].children[1].insertAdjacentHTML(
          "afterend",
          '<span id="bph-close-notification" class="bph-close-notification">' +
          '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
          '</span>',
        );

        var closeButton = document.getElementById("bph-close-notification");
        if (closeButton && !closeButton.dataset.bound) {
          closeButton.dataset.bound = "true";
          closeButton.addEventListener("click", function () {
            this.parentNode.parentNode.querySelector(".component_header").style.background = "#f5e4c2";
            this.parentNode.remove();
          });
        }
      }
    }
  }, 1000);
};
