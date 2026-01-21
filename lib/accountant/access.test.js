// Minimal JS export for Node test runner
function validateInvitedEmail(email) {
  if (typeof email !== "string") {
    throw new Error("E-mailadres is verplicht.");
  }
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    throw new Error("E-mailadres is verplicht.");
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalized)) {
    throw new Error("Voer een geldig e-mailadres in.");
  }
  return normalized;
}

module.exports = { validateInvitedEmail };
