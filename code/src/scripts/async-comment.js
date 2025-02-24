import axios from "axios";
import validator from "validator";

const submitCommentForm = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const formValues = Object.fromEntries(formData);

    console.log("Comment form data:", formValues);

    if (validator.isEmpty(formValues.content.trim())) {
        document.querySelector("[data-error-message='comment']").classList.remove("hidden");
        return;
    }

    if (formValues.nickname === "") {
        formValues.nickname = "Anonyme";
    }
    try {
        await axios.post(`${e.target.action}/comments`, formValues, {
            headers: { "Content-Type": "application/json" },
        });

        document.querySelector("#flash-container").innerHTML = `
          <p class="font-bold rounded-lg p-3 bg-green-100 text-green-800 border-solid border-x border-y border-green-700 mt-3 mb-2">
            Commentaire posté.
          </p>
        `;
        document.querySelector("#async-comment-container").innerHTML = `
        <hr>
        <div class="my-3 relative grid grid-cols-1 gap-4 p-4 mb-8 border rounded-lg bg-white shadow-lg">
            <div class="relative flex gap-4">
                <div class="flex flex-col w-full">
                    <div class="flex flex-row justify-between">
                        <p class="relative text-xl whitespace-nowrap truncate overflow-hidden font-bold">${formValues.nickname}</p>
                        <a class="text-gray-500 text-xl" href="#"><i class="fa-solid fa-trash"></i></a>
                    </div>
                    <p class="text-gray-400 text-sm">il y a quelques secondes...</p>
                </div>
            </div>
            <p class="-mt-4">${formValues.content}</p>
        </div>`;
    } catch (error) {
        const errors = error.response?.data?.errors || ["An error occurred"];
        let errorHTML = "";
        errors.forEach(item => {
            errorHTML += `<p class="rounded-lg p-3 bg-red-100 text-red-800 border-solid border-x border-y border-red-700 mb-3">${item}</p>`;
        });
        document.querySelector("#flash-container").innerHTML = errorHTML;
    }
};

document.querySelectorAll("[data-async-comment-form]").forEach((item) => {
    item.addEventListener("submit", submitCommentForm);
});
