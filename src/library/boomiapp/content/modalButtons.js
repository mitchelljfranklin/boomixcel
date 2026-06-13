const modal_listener = (modal) => {
  if (BoomiPlatform.reverse_modal == "on") {
    if (modal.lastChild && modal.lastChild.lastChild && modal.lastChild.lastChild.innerText === "Cancel") {
      $(modal.lastChild.lastChild).insertBefore(modal.lastChild.children[0]);
    }
  }
};
