const PH_MOBILE_PATTERN = /^09\d{9}$/;
const PH_MOBILE_INTL_PATTERN = /^\+639\d{9}$/;
const EMAIL_PATTERN = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;
const NAME_PATTERN = /^[A-Za-z][A-Za-z .'-]{1,99}$/;

const normalizePhone = value => {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('63') && digits.length === 12) return `0${digits.slice(2)}`;
  return digits;
};

function validateOwnerFields(input) {
  const name = String(input.name || '').trim().replace(/\s+/g, ' ');
  const email = String(input.email || '').trim().toLowerCase();
  const phone = normalizePhone(input.phone);
  const errors = {};

  if (!NAME_PATTERN.test(name) || name.split(/\s+/).length < 2) errors.name = 'Enter the owner’s first and last name.';
  else if (/^(.)\1+$/.test(name.replace(/\s/g, '').toLowerCase())) errors.name = 'Enter a plausible owner name.';
  if (!PH_MOBILE_PATTERN.test(phone) && !PH_MOBILE_INTL_PATTERN.test(phone)) {
    errors.phone = 'Use an 11-digit Philippine mobile number starting with 09, or +639 followed by 9 digits.';
  } else if (/^(\d)\1+$/.test(phone.replace('+', ''))) errors.phone = 'Enter a plausible mobile number.';
  if (!EMAIL_PATTERN.test(email)) errors.email = 'Enter a complete email address with a valid domain.';
  else if (email.length > 254 || email.includes('..')) errors.email = 'Enter a plausible email address.';

  return { errors, normalized: { ...input, name, email, phone } };
}

const parseDate = value => {
  const date = new Date(value);
  return value && !Number.isNaN(date.getTime()) ? date : null;
};

function validateClinicalDates({ dateGiven, nextDue, administrationDate, expiry }) {
  const errors = {};
  const given = parseDate(dateGiven);
  const due = parseDate(nextDue);
  const administered = parseDate(administrationDate);
  const expires = parseDate(expiry);
  const now = new Date();

  if (dateGiven && !given) errors.dateGiven = 'Enter a valid vaccination date.';
  if (nextDue && !due) errors.nextDue = 'Enter a valid next-due date.';
  if (given && given > now) errors.dateGiven = 'Vaccination date cannot be in the future.';
  if (given && due && due <= given) errors.nextDue = 'Next-due date must be later than the date given.';
  if (administrationDate && !administered) errors.administrationDate = 'Enter a valid administration date.';
  if (expiry && !expires) errors.expiry = 'Enter a valid product expiry date.';
  if (administered && expires && expires < administered) errors.expiry = 'Product expiry cannot be before administration date.';
  return errors;
}

function validateOverrideReason(reason) {
  const value = String(reason || '').trim();
  return value.length >= 15 ? null : 'A clinical reason of at least 15 characters is required for an override.';
}

module.exports = { validateOwnerFields, normalizePhone, validateClinicalDates, validateOverrideReason };
