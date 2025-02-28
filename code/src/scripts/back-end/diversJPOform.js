import axios from "axios";

document.addEventListener("DOMContentLoaded", () => {
    const editBtn = document.getElementById("edit-btn");
    const saveBtn = document.getElementById("save-btn");
    const form = document.getElementById("jpo-form");
    const flashContainer = document.getElementById("flash-container");

    editBtn.addEventListener("click", () => {
        form.querySelectorAll("input").forEach(input => {
            input.removeAttribute("disabled");
            input.classList.remove("bg-gray-100", "cursor-not-allowed");
        });
        saveBtn.removeAttribute("disabled");
        saveBtn.classList.remove("opacity-50", "cursor-not-allowed", "bg-gray-500", "hover:bg-gray-400");
        saveBtn.classList.add("bg-blue-500", "hover:bg-blue-700");
        editBtn.classList.add("opacity-50", "cursor-not-allowed", "bg-gray-300");
        editBtn.setAttribute("disabled", "true");
    });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Récupérer les valeurs du formulaire
        const formData = new FormData(form);
        const formJPOValues = Object.fromEntries(formData.entries());

        try {
            const response = await axios.post("/admin/divers", formJPOValues, {
                headers: {
                    "Content-Type": "application/json",
                },
            });

            flashContainer.innerHTML = `<p class="rounded-lg p-3 bg-green-100 text-green-800 border-solid border-x border-y border-green-700 mb-3">${response.data.message}</p>`;
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Erreur lors de la mise à jour.";
            flashContainer.innerHTML = `<p class="rounded-lg p-3 bg-red-100 text-red-800 border-solid border-x border-y border-red-700 mb-3">${errorMsg}</p>`;
        }

        // Remettre les champs en lecture seule après 500 ms
        setTimeout(() => {
            form.querySelectorAll("input").forEach(input => {
                input.setAttribute("disabled", "true");
                input.classList.add("bg-gray-100", "cursor-not-allowed");
            });
            saveBtn.setAttribute("disabled", "true");
            saveBtn.classList.remove("bg-blue-500", "hover:bg-blue-700");
            saveBtn.classList.add("opacity-50", "cursor-not-allowed", "bg-gray-500", "hover:bg-gray-400");
            editBtn.classList.remove("opacity-50", "cursor-not-allowed", "bg-gray-300");
            editBtn.removeAttribute("disabled");
        }, 500);
    });
});
