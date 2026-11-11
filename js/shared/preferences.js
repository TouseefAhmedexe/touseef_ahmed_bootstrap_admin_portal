import { readStored, writeStored } from "./storage.js";

export const DEFAULT_PREFERENCES = { toastUsers: true, toastForms: true };

export function getPreferences() {
    const saved = readStored("notifications");

    if (saved === null) {
        return { ...DEFAULT_PREFERENCES };
    }

    try {
        const data = JSON.parse(saved);

        return {
            toastUsers: typeof data.toastUsers === "boolean" ? data.toastUsers : DEFAULT_PREFERENCES.toastUsers,
            toastForms: typeof data.toastForms === "boolean" ? data.toastForms : DEFAULT_PREFERENCES.toastForms
        };
    } catch (error) {
        return { ...DEFAULT_PREFERENCES };
    }
}

export function savePreferences(preferences) {
    return writeStored("notifications", JSON.stringify(preferences));
}