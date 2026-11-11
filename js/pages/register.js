import { makeElement, requireElement } from "../shared/dom.js";
import { initLayout } from "../shared/layout.js";
import { showPasswordStrength, syncPasswordMatch } from "../shared/password.js";
import { getPreferences } from "../shared/preferences.js";
import { showToast } from "../shared/toast.js";
import { bindLiveValidation, resetValidation, showFieldState, validateForm } from "../shared/validation.js";

initLayout();

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

const form = requireElement("register-form");
const passwordField = requireElement("reg-password");
const confirmField = requireElement("reg-confirm");
const strengthMeter = requireElement("reg-strength");
const strengthText = requireElement("reg-strength-text");
const imageInput = requireElement("reg-image");
const previewArea = requireElement("reg-preview-area");

let previewUrl = null;

function clearPreview() {
    if (previewUrl !== null) {
        URL.revokeObjectURL(previewUrl);
        previewUrl = null;
    }

    previewArea.textContent = "";
}

function checkImage() {
    const [file] = imageInput.files;

    clearPreview();

    if (file === undefined) {
        imageInput.setCustomValidity("");
        return;
    }

    if (!file.type.startsWith("image/")) {
        imageInput.setCustomValidity("Choose an image file (PNG, JPG or WebP).");
        return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
        imageInput.setCustomValidity("The image is larger than 2 MB. Choose a smaller file.");
        return;
    }

    const preview = makeElement("img", "avatar-preview rounded-circle border");

    imageInput.setCustomValidity("");
    previewUrl = URL.createObjectURL(file);
    preview.src = previewUrl;
    preview.alt = "Preview of the chosen profile image";
    previewArea.append(preview);
}

function clearGeneratedState() {
    resetValidation(form);
    clearPreview();
    imageInput.setCustomValidity("");
    confirmField.setCustomValidity("");
    showPasswordStrength("", strengthMeter, strengthText);
}

passwordField.addEventListener("input", () => {
    showPasswordStrength(passwordField.value, strengthMeter, strengthText);
    syncPasswordMatch(passwordField, confirmField);

    if (confirmField.dataset.touched === "true" || form.dataset.submitted === "true") {
        showFieldState(confirmField);
    }
});

confirmField.addEventListener("input", () => syncPasswordMatch(passwordField, confirmField));
imageInput.addEventListener("input", checkImage);
form.addEventListener("reset", clearGeneratedState);

form.addEventListener("submit", (event) => {
    event.preventDefault();
    form.dataset.submitted = "true";
    syncPasswordMatch(passwordField, confirmField);

    if (!validateForm(form)) {
        showToast("Please fix the highlighted answers.", "danger");
        return;
    }

    const name = new FormData(form).get("full_name").trim();

    form.reset();

    if (getPreferences().toastForms) {
        showToast(`Thank you, ${name}. The registration form is complete. No server is connected, so nothing was sent.`, "success");
    }
});

bindLiveValidation(form);
showPasswordStrength("", strengthMeter, strengthText);