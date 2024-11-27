import { delegateEventHandler } from "#fe/utils";

const listPreviewCurrentImageBtn = document.querySelectorAll(
    "[data-preview-current-image-button]"
);
const modal = document.querySelector("[data-modal]");
const tplId = "preview-image";
const modalTemplate = document.querySelector(`[data-tpl-id='${tplId}']`);
const modalTemplateContent = modalTemplate.content.cloneNode(true);
const listImageModal = modalTemplateContent.querySelectorAll("[data-image]");
const imageDimensions = modalTemplateContent.querySelector("[data-image-dimensions]");
const imageSize = modalTemplateContent.querySelector("[data-image-size]");
const imageMime = modalTemplateContent.querySelector("[data-image-mime]");
const imageName = modalTemplateContent.querySelector("[data-image-name]");

const formatBytes = (bytes, decimals = 2) => {
    if (!+bytes) return "0 Bytes";

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "kB", "MB", "GB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${String(parseFloat((bytes / Math.pow(k, i)).toFixed(dm))).replace(".", ",")} ${sizes[i]}`;
}

const getImageInfos = async (img) => {
    const blobQuery = await fetch(img.src);
    const blob = await blobQuery.blob();

    const imgInstance = new Image();
    imgInstance.src = img.src;
    await imgInstance.decode();

    const imgName = img.dataset?.originalName || img.src.replace(/^.*[\\/]/, "");

    return {
        width: imgInstance.width,
        height: imgInstance.height,
        size: blob.size,
        mime: blob.type,
        name: imgName.split(".")[0],
    };
};

const toggleBigImage = () => {
    ["!bg-transparent", "!shadow-none", "!h-screen", "md:my-8", "!max-w-full"].forEach((cssClass) => modal.classList.toggle(cssClass));
    modal.querySelector("[data-main-content]").classList.toggle("opacity-0");
    ["opacity-0", "pointer-events-none", "h-0"].forEach((cssClass) => modal.querySelector("[data-reduce-image-btn]").classList.toggle(cssClass));
};

delegateEventHandler(modal, "click", "[data-enlarge-image-btn]", () => {
    toggleBigImage(true);
});

modal.addEventListener("transitionend", (e) => {
    if (e.propertyName !== "background-color") {
        return;
    }

    const bgColor = window.getComputedStyle(e.target).getPropertyValue("background-color");
    if (bgColor === "rgba(0, 0, 0, 0)") {
        modal.querySelector("[data-reduce-image-btn]").inert = false;
        modal.querySelector("[data-enlarge-image-btn]").inert = true;
        modal.querySelector("[data-main-content]").classList.add("!hidden");
    } else {
        modal.querySelector("[data-reduce-image-btn]").inert = true;
        modal.querySelector("[data-enlarge-image-btn]").inert = false;
        modal.querySelector("[data-main-content]").classList.remove("!hidden");
    }
});

delegateEventHandler(modal, "click", "[data-reduce-image-btn]", () => {
    toggleBigImage();
    modal.querySelector("[data-main-content]").classList.toggle("!hidden");
});

listPreviewCurrentImageBtn.forEach((item) => {
    item.addEventListener("click", async (e) => {
        modal.dataset.modal = tplId;
        const dataAttr = e.currentTarget.dataset.previewCurrentImageButton;
        const previewType = e.currentTarget.dataset.previewType;
        
        let img = document.querySelector(`[data-current-image="${dataAttr}"]`);
        
        if (previewType === "blob") {
            img = document.querySelector(`[data-preview-upload="${dataAttr}"]`);
        }

        listImageModal.forEach((item) => item.src = img.src)

        const imgData = await getImageInfos(img);

        imageName.textContent = imgData.name;
        imageName.title = imgData.name;
        imageDimensions.textContent = `${imgData.width} × ${imgData.height}`;
        imageSize.textContent = `${formatBytes(imgData.size)}`;
        imageMime.textContent = imgData.mime;
        
        while (modal.firstChild) {
            modal.removeChild(modal.firstChild);
        }

        modal.append(modalTemplateContent.cloneNode(true));
        modal.showModal();
    });
});

modal.addEventListener("close", (e) => {
    if (e.currentTarget.dataset.modal !== tplId) {
        return;
    }

    modal.classList.remove(...["!bg-transparent", "!shadow-none", "!h-screen", "!max-w-full"]);
    modal.classList.add("md:my-8");

    modal.querySelector("[data-reduce-image-btn]").classList.add(...["opacity-0", "pointer-events-none", "h-0"]);
    modal.querySelector("[data-main-content]").classList.remove("opacity-0");
    modal.querySelector("[data-reduce-image-btn]").inert = true;
    modal.querySelector("[data-enlarge-image-btn]").inert = false;
});
