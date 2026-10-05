const PH_MOBILE_PATTERN = /^09\d{9}$/;
const PH_MOBILE_INTL_PATTERN = /^\+639\d{9}$/;
const EMAIL_PATTERN = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;
const NAME_PATTERN = /^[A-Za-z][A-Za-z .'-]{1,99}$/;

export const normalizePhone = value => {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('63') && digits.length === 12) return `0${digits.slice(2)}`;
  return digits;
};

export function validateOwnerFields(form) {
  const name = String(form.name || '').trim().replace(/\s+/g, ' ');
  const email = String(form.email || '').trim().toLowerCase();
  const phone = normalizePhone(form.phone);
  const errors = {};

  if (!NAME_PATTERN.test(name) || name.split(/\s+/).length < 2) {
    errors.name = 'Enter the owner’s first and last name.';
  } else if (/^(.)\1+$/.test(name.replace(/\s/g, '').toLowerCase())) {
    errors.name = 'Enter a real owner name, not repeated characters.';
  }

  if (!PH_MOBILE_PATTERN.test(phone) && !PH_MOBILE_INTL_PATTERN.test(phone)) {
    errors.phone = 'Use an 11-digit Philippine mobile number starting with 09, or +639 followed by 9 digits.';
  } else if (/^(\d)\1+$/.test(phone.replace('+', ''))) {
    errors.phone = 'Enter a plausible mobile number.';
  }

  if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Enter a complete email address with a valid domain.';
  } else if (email.length > 254 || email.includes('..')) {
    errors.email = 'Enter a plausible email address.';
  }

  return { errors, normalized: { ...form, name, email, phone } };
}
