import { delegateEventHandler } from "#fe/utils";

const listDeleteCurrentImageBtn = document.querySelectorAll(
    "[data-delete-current-image-button]"
);
const modal = document.querySelector("[data-modal]");
const tplId = "delete-image";
const modalTemplate = document.querySelector(`[data-tpl-id='${tplId}']`);
const modalTemplateContent = modalTemplate.content.cloneNode(true);

const deleteItemModalBtn = modalTemplateContent.querySelector("[data-delete-item]");
const imageModalContainer = modalTemplateContent.querySelector("[data-image]");

const imageObserver = new MutationObserver((mutationList) => {
    mutationList.forEach((mutation) => {
        if (mutation.type === "attributes") {
            const deleteBtn = document.querySelector(
                `[data-delete-current-image-button="${mutation.target.dataset.currentImage}"]`
            );
            const btnPreview = document.querySelector(
                `[data-preview-current-image-button="${mutation.target.dataset.currentImage}"][data-preview-type="image"]`
            );

            const newValue = mutation.target.getAttribute("src");

            deleteBtn.classList.toggle("hidden", newValue === "");
            btnPreview.classList.toggle("hidden", newValue === "");
        }
    });
});

listDeleteCurrentImageBtn.forEach((item) => {
    item.addEventListener("click", (e) => {
        const dataAttr = e.currentTarget.dataset.deleteCurrentImageButton;
        deleteItemModalBtn.dataset.deleteCurrentImageButtonModal = dataAttr;
        const img = document.querySelector(
            `[data-current-image="${dataAttr}"]`
        );
        imageModalContainer.src = img.src;

        while (modal.firstChild) {
            modal.removeChild(modal.firstChild);
        }
        modal.append(modalTemplateContent.cloneNode(true));
        modal.showModal();
    });
});

delegateEventHandler(modal, "click", "[data-delete-item]", async (e) => {
    if (!modal.open && e.currentTarget.dataset.modal !== tplId) {
        return;
    }

    const dataAttr = e.target.dataset.deleteCurrentImageButtonModal;
    const input = document.querySelector(
        `[data-current-image-checkbox="${dataAttr}"]`
    );
    input.checked = true;

    const img = document.querySelector(`[data-current-image="${dataAttr}"]`);
    img.src = "";

    const btnPreview = document.querySelector(
        `[data-preview-current-image-button="${dataAttr}"][data-preview-type="image"]`
    );
    btnPreview.classList.add("hidden");

    imageObserver.observe(img, {
        attributes: true,
    });

    e.target.closest("dialog").close();
    document.querySelector(`[data-delete-current-image-button="${dataAttr}"]`).classList.add("hidden");
    document.querySelector(`[data-preview-current-image-button="${dataAttr}"]`).classList.add("hidden");
});
