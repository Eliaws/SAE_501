import validator from "validator";
import axios from "axios"; // si vous préférez axios

const submitForm = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const formValues = Object.fromEntries(formData);

    console.log("Données du formulaire :", formValues);

    if (validator.isEmpty(formValues.lastname.trim())) {
        document.querySelector("[data-error-message='lastname']").classList.remove("hidden");
        return;
    }

    try {
        await axios.post(e.target.action, formValues, {
            headers: { "Content-Type": "application/json" },
        });
        // Mettre à jour dynamiquement le conteneur avec le message de succès
        document.querySelector("#flash-container").innerHTML = `
          <p class="rounded-lg p-3 bg-green-100 text-green-800 border-solid border-x border-y border-green-700 mb-3">
            Votre message a bien été envoyé. Nous vous répondrons dans les plus brefs délais.
          </p>
        `;
    } catch (error) {
        const errors = error.response?.data?.errors || ["Une erreur est survenue"];
        let errorHTML = "";
        errors.forEach(item => {
            errorHTML += `<p class="rounded-lg p-3 bg-red-100 text-red-800 border-solid border-x border-y border-red-700 mb-3">${item}</p>`;
        });
        document.querySelector("#flash-container").innerHTML = errorHTML;
    }
};

document.querySelectorAll("[data-async-form]").forEach((item) => {
    item.addEventListener("submit", submitForm);
});
