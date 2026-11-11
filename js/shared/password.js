const LABELS = ["Very weak", "Weak", "Fair", "Good", "Strong"];
const BAR_COLORS = ["bg-danger", "bg-danger", "bg-warning", "bg-info", "bg-success"];
const BAR_WIDTHS = ["", "w-25", "w-50", "w-75", "w-100"];
const DYNAMIC_CLASSES = ["bg-danger", "bg-warning", "bg-info", "bg-success", "w-25", "w-50", "w-75", "w-100"];

const isLower = (character) => character >= "a" && character <= "z";
const isUpper = (character) => character >= "A" && character <= "Z";
const isDigit = (character) => character >= "0" && character <= "9";
const isSymbol = (character) => !isLower(character) && !isUpper(character) && !isDigit(character);

export function getPasswordScore(password) {
    const characters = [...password];
    const checks = [
        password.length >= 8,
        characters.some(isLower) && characters.some(isUpper),
        characters.some(isDigit),
        characters.some(isSymbol)
    ];

    return checks.filter((passed) => passed).length;
}

export function showPasswordStrength(password, meter, text) {
    const bar = meter.firstElementChild;

    bar.classList.remove(...DYNAMIC_CLASSES);

    if (password === "") {
        meter.setAttribute("aria-valuenow", "0");
        text.textContent = "Type a password to see its strength.";
        return;
    }

    const score = getPasswordScore(password);

    meter.setAttribute("aria-valuenow", String(score));
    bar.classList.add(BAR_COLORS[score]);

    if (BAR_WIDTHS[score] !== "") {
        bar.classList.add(BAR_WIDTHS[score]);
    }

    text.textContent = `Strength: ${LABELS[score]} (${score} of 4 checks passed).`;
}

export function syncPasswordMatch(passwordField, confirmField) {
    const mismatch = confirmField.value !== passwordField.value;

    confirmField.setCustomValidity(mismatch ? "The passwords do not match." : "");
}