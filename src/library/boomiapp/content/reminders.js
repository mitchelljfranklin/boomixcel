//Reminder to create schedule after deployment

document.arrive(
  "[data-locator='button-view-deployments']",
  function (deploymentScreen) {

      if (BoomiPlatform.reminder_schedule === "on") {
        let scheduleHtml = `
    <p class="bph-reminder-badge"><b>REMINDER:</b> Don't forget to set up a schedule in the runtime if its required for your deployed service</p>`;
        deploymentScreen.offsetParent.parentNode.firstChild.firstChild.children[1].insertAdjacentHTML(
          "afterend",
          scheduleHtml,
        );
      }
  },
);
