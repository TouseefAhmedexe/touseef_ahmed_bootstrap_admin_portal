import { requireElement, getBootstrap } from "../shared/dom.js";
import { chooseTheme, getSavedTheme, initLayout, isSidebarCollapsed, setSidebarCollapsed } from "../shared/layout.js";
import { showPasswordStrength, syncPasswordMatch } from "../shared/password.js";
import { getPreferences, savePreferences } from "../shared/preferences.js";
import { readStored, writeStored } from "../shared/storage.js";
import { showToast } from "../shared/toast.js";
import { bindLiveValidation, resetValidation, showFieldState, validateForm } from "../shared/validation.js";

initLayout();

const TAB_KEY = "settings-tab";

const tabList = requireElement("settings-tabs");
const tabButtons = [...tabList.querySelectorAll('[data-bs-toggle="tab"]')];
const profileForm = requireElement("profile-form");
const passwordForm = requireElement("password-form");
const newPassword = requireElement("new-password");
const confirmNewPassword = requireElement("confirm-new-password");
const strengthMeter = requireElement("new-strength");
const strengthText = requireElement("new-strength-text");
const accountForm = requireElement("account-form");
const sidebarSwitch = requireElement("pref-sidebar");
const themeRadios = [...document.querySelectorAll("input[name='theme_choice']")];
const notificationForm = requireElement("notification-form");
const toastUsersSwitch = requireElement("pref-toast-users");
const toastFormsSwitch = requireElement("pref-toast-forms");

function bindCheckedForm(form, successMessage, onSuccess = () => {}) {
    bindLiveValidation(form);

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        form.dataset.submitted = "true";

        if (!validateForm(form)) {
            showToast("Please fix the highlighted answers.", "danger");
            return;
        }

        showToast(successMessage, "success");
        onSuccess(form);
    });
}

function restoreTab() {
    const savedId = readStored(TAB_KEY);
    const button = tabButtons.find((tab) => tab.id === savedId);

    if (button !== undefined) {
        getBootstrap().Tab.getOrCreateInstance(button).show();
    }
}

function writeAccountControls() {
    const saved = getSavedTheme();

    themeRadios.forEach((radio) => {
        radio.checked = radio.value === saved;
    });
    sidebarSwitch.checked = isSidebarCollapsed();
}

function writePreferenceControls() {
    const preferences = getPreferences();

    toastUsersSwitch.checked = preferences.toastUsers;
    toastFormsSwitch.checked = preferences.toastForms;
}

bindCheckedForm(profileForm, "The profile form is valid. No server is connected, so nothing was saved.");

bindCheckedForm(
    passwordForm,
    "The password form is valid. No server is connected, so the password was not changed.",
    (form) => form.reset()
);

newPassword.addEventListener("input", () => {
    showPasswordStrength(newPassword.value, strengthMeter, strengthText);
    syncPasswordMatch(newPassword, confirmNewPassword);

    if (confirmNewPassword.dataset.touched === "true" || passwordForm.dataset.submitted === "true") {
        showFieldState(confirmNewPassword);
    }
});

confirmNewPassword.addEventListener("input", () => syncPasswordMatch(newPassword, confirmNewPassword));

passwordForm.addEventListener("reset", () => {
    resetValidation(passwordForm);
    confirmNewPassword.setCustomValidity("");
    showPasswordStrength("", strengthMeter, strengthText);
});

themeRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
        if (!radio.checked) {
            return;
        }

        const wasSaved = chooseTheme(radio.value);

        showToast(
            wasSaved ? "Theme choice saved in this browser." : "The theme changed, but your browser blocked saving it.",
            wasSaved ? "success" : "danger"
        );
    });
});

sidebarSwitch.addEventListener("change", () => setSidebarCollapsed(sidebarSwitch.checked));
accountForm.addEventListener("submit", (event) => event.preventDefault());

notificationForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const wasSaved = savePreferences({
        toastUsers: toastUsersSwitch.checked,
        toastForms: toastFormsSwitch.checked
    });

    showToast(
        wasSaved ? "Notification preferences saved in this browser." : "Your browser blocked saving the preferences.",
        wasSaved ? "success" : "danger"
    );
});

tabList.addEventListener("shown.bs.tab", (event) => writeStored(TAB_KEY, event.target.id));

const themeButton = document.getElementById("theme-button");

if (themeButton !== null) {
    themeButton.addEventListener("click", writeAccountControls);
}

writeAccountControls();
writePreferenceControls();
showPasswordStrength("", strengthMeter, strengthText);
restoreTab();