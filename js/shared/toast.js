import { getBootstrap, makeElement, requireElement } from "./dom.js";

const TOAST_STYLES = {
    success: "text-bg-success",
    danger: "text-bg-danger",
    warning: "text-bg-warning",
    info: "text-bg-primary"
};

export function showToast(message, kind = "info") {
    const area = requireElement("toast-area");
    const isDanger = kind === "danger";
    const toast = makeElement("div", `toast align-items-center border-0 ${TOAST_STYLES[kind] ?? TOAST_STYLES.info}`);
    const row = makeElement("div", "d-flex");
    const body = makeElement("div", "toast-body", message);
    const closeButton = makeElement("button", `btn-close ${kind === "warning" ? "" : "btn-close-white"} me-2 m-auto`);

    toast.setAttribute("role", isDanger ? "alert" : "status");
    toast.setAttribute("aria-live", isDanger ? "assertive" : "polite");
    toast.setAttribute("aria-atomic", "true");

    closeButton.type = "button";
    closeButton.dataset.bsDismiss = "toast";
    closeButton.setAttribute("aria-label", "Close");

    row.append(body, closeButton);
    toast.append(row);
    area.append(toast);

    toast.addEventListener("hidden.bs.toast", () => toast.remove());
    getBootstrap().Toast.getOrCreateInstance(toast, { delay: 4500 }).show();
}