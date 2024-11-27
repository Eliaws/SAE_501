import axios from "axios";

import { delegateEventHandler } from "#fe/utils";

const modal = document.querySelector("[data-modal]");
const tplId = "delete-entry";
const modalTemplate = document.querySelector(`[data-tpl-id='${tplId}']`);
const modalTemplateContent = document.importNode(modalTemplate.content, true);

const displayDeleteItemModal = (e) => {
    while (modal.firstChild) {
        modal.removeChild(modal.firstChild);
    }
    modal.dataset.modal = tplId;
    modal.append(modalTemplateContent.cloneNode(true));
    modal.showModal();

    modal.querySelector("[data-delete-item]").dataset.deleteItem = e.currentTarget.dataset.deleteUrl;
    modal.querySelector("[data-modal-item-name]").textContent = e.currentTarget.dataset.deleteName;
};

delegateEventHandler(modal, "click", "[data-delete-item]", async (e) => {
    e.target.inert = true;
    modal.querySelector("[data-close-modal]").inert = true;

    const errorMessageModal = modalTemplateContent.querySelector("[data-error-modal]");

    await axios
        .delete(e.target.dataset.deleteItem)
        .then(() => {
            window.location.reload();
        })
        .catch((error) => {
            errorMessageModal.textContent = error.response.data.error || "Erreur"; // error.response.data.error || 
            errorMessageModal.classList.remove("hidden");
            e.target.inert = false;
            modal.querySelector("[data-close-modal]").inert = false;
        });
});

document.querySelectorAll('[data-modal-id="delete-entry"]').forEach((item) => {
    item.addEventListener("click", displayDeleteItemModal);
});
