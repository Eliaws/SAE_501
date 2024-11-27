const listDisplayDetailsBreadcrumbBtn = document.querySelectorAll(
    "[data-display-details-breadcrumb]"
);
const modal = document.querySelector("[data-modal]");
const tplId = "breadcrumb-details";
const modalTemplate = document.querySelector(`[data-tpl-id='${tplId}']`);
const modalTemplateContent = modalTemplate.content.cloneNode(true);

listDisplayDetailsBreadcrumbBtn.forEach((item) => {
    item.addEventListener("click", async (e) => {
        modal.dataset.modal = tplId;
        const breadcrumbContentRaw = e.currentTarget.dataset.displayDetailsBreadcrumb;
        const breadcrumbContent = breadcrumbContentRaw.split(",").map((item) => {
            return {
                name: item.split("/").at(-1),
                path: `/${item}`,
            };
        });

        const breadcrumbList = modalTemplateContent.querySelector(
            "[data-content-list]"
        );

        while (breadcrumbList.firstChild) {
            breadcrumbList.removeChild(breadcrumbList.firstChild);
        }

        const breadcrumbListItemTemplate = document.querySelector(
            "[data-tpl-id='breadcrumb-item']"
        );
        
        breadcrumbContent.forEach((breadcrumbItem, idx) => {
            const breadcrumbListItemTemplateContent = breadcrumbListItemTemplate.content.cloneNode(true);
            const linkTag = breadcrumbListItemTemplateContent.querySelector("a");
            linkTag.textContent = breadcrumbItem.name;
            linkTag.href = breadcrumbItem.path;

            breadcrumbListItemTemplateContent.querySelector("li").inert = idx === breadcrumbContent.length - 1;
            breadcrumbList.append(breadcrumbListItemTemplateContent);
        });

        while (modal.firstChild) {
            modal.removeChild(modal.firstChild);
        }

        modal.append(modalTemplateContent.cloneNode(true));
        modal.showModal();
    });
});
