function getControls(field) {
    if (field.type === "radio" && field.form !== null) {
        return [...field.form.querySelectorAll(`input[name="${field.name}"]`)];
    }

    return [field];
}

function isFilled(control) {
    if (control.type === "checkbox" || control.type === "radio") {
        return control.checked;
    }

    return control.value !== "";
}

export function getErrorMessage(field) {
    const { validity } = field;
    const label = field.dataset.label ?? "This field";

    if (validity.valid) {
        return "";
    }

    if (validity.valueMissing) {
        return field.dataset.requiredMessage ?? `${label} is required.`;
    }

    if (validity.customError) {
        return field.validationMessage;
    }

    if (validity.typeMismatch) {
        return `Enter a valid ${label.toLowerCase()}.`;
    }

    if (validity.tooShort) {
        return `${label} must have at least ${field.minLength} characters.`;
    }

    if (validity.patternMismatch) {
        return field.dataset.patternMessage ?? `${label} is not in the right format.`;
    }

    if (validity.rangeUnderflow || validity.rangeOverflow) {
        return `${label} must be between ${field.min} and ${field.max}.`;
    }

    return field.validationMessage;
}

export function showFieldState(field) {
    const message = getErrorMessage(field);
    const wrapper = field.closest("[data-field]");
    const feedback = wrapper === null ? null : wrapper.querySelector(".invalid-feedback");
    const controls = getControls(field);
    const filled = controls.some(isFilled);

    controls.forEach((control) => {
        control.classList.toggle("is-invalid", message !== "");
        control.classList.toggle("is-valid", message === "" && filled);
    });

    if (feedback !== null) {
        feedback.textContent = message;
        feedback.classList.toggle("d-block", message !== "");
    }
}

export function validateForm(form) {
    const fields = [...form.elements].filter((field) => {
        return field.matches("input, select, textarea") && field.willValidate && field.type !== "hidden";
    });

    fields.forEach((field) => showFieldState(field));

    const firstInvalid = form.querySelector(".is-invalid");

    if (firstInvalid !== null) {
        firstInvalid.focus();
    }

    return form.checkValidity();
}

export function resetValidation(form) {
    form.querySelectorAll(".is-valid, .is-invalid").forEach((control) => {
        control.classList.remove("is-valid", "is-invalid");
    });

    form.querySelectorAll(".invalid-feedback").forEach((box) => {
        box.textContent = "";
        box.classList.remove("d-block");
    });

    form.querySelectorAll("[data-touched]").forEach((control) => control.removeAttribute("data-touched"));
    form.removeAttribute("data-submitted");
}

export function bindLiveValidation(form) {
    form.addEventListener("blur", (event) => {
        const field = event.target;

        if (field.matches("input, select, textarea") && field.willValidate) {
            field.dataset.touched = "true";
            showFieldState(field);
        }
    }, true);

    form.addEventListener("input", (event) => {
        const field = event.target;

        if (!field.matches("input, select, textarea")) {
            return;
        }

        if (field.dataset.touched === "true" || form.dataset.submitted === "true") {
            showFieldState(field);
        }
    });
}