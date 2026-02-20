/** Normalize phone to digits only (with optional leading country code). */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '').trim();
}

/** Default country code (India). */
export const DEFAULT_COUNTRY_CODE = '91';

/** Country codes for the UI selector: { code, label }. India first (default). */
export const COUNTRY_CODES: { code: string; label: string }[] = [
  { code: '91', label: 'India (+91)' },
  { code: '1', label: 'US / Canada (+1)' },
  { code: '44', label: 'UK (+44)' },
  { code: '61', label: 'Australia (+61)' },
  { code: '81', label: 'Japan (+81)' },
  { code: '86', label: 'China (+86)' },
  { code: '49', label: 'Germany (+49)' },
  { code: '33', label: 'France (+33)' },
  { code: '971', label: 'UAE (+971)' },
  { code: '65', label: 'Singapore (+65)' },
  { code: '55', label: 'Brazil (+55)' },
  { code: '52', label: 'Mexico (+52)' },
  { code: '234', label: 'Nigeria (+234)' },
  { code: '27', label: 'South Africa (+27)' },
  { code: '92', label: 'Pakistan (+92)' },
  { code: '880', label: 'Bangladesh (+880)' },
  { code: '94', label: 'Sri Lanka (+94)' },
  { code: '62', label: 'Indonesia (+62)' },
  { code: '60', label: 'Malaysia (+60)' },
  { code: '63', label: 'Philippines (+63)' },
  { code: '84', label: 'Vietnam (+84)' },
  { code: '66', label: 'Thailand (+66)' },
  { code: '82', label: 'South Korea (+82)' },
  { code: '31', label: 'Netherlands (+31)' },
  { code: '39', label: 'Italy (+39)' },
  { code: '34', label: 'Spain (+34)' },
  { code: '48', label: 'Poland (+48)' },
  { code: '7', label: 'Russia (+7)' },
  { code: '90', label: 'Turkey (+90)' },
  { code: '20', label: 'Egypt (+20)' },
  { code: '254', label: 'Kenya (+254)' },
  { code: '233', label: 'Ghana (+233)' },
  { code: '212', label: 'Morocco (+212)' },
  { code: '213', label: 'Algeria (+213)' },
  { code: '966', label: 'Saudi Arabia (+966)' },
  { code: '972', label: 'Israel (+972)' },
  { code: '98', label: 'Iran (+98)' },
  { code: '964', label: 'Iraq (+964)' },
  { code: '963', label: 'Syria (+963)' },
  { code: '961', label: 'Lebanon (+961)' },
  { code: '962', label: 'Jordan (+962)' },
  { code: '965', label: 'Kuwait (+965)' },
  { code: '973', label: 'Bahrain (+973)' },
  { code: '974', label: 'Qatar (+974)' },
  { code: '968', label: 'Oman (+968)' },
  { code: '353', label: 'Ireland (+353)' },
  { code: '32', label: 'Belgium (+32)' },
  { code: '41', label: 'Switzerland (+41)' },
  { code: '43', label: 'Austria (+43)' },
  { code: '46', label: 'Sweden (+46)' },
  { code: '47', label: 'Norway (+47)' },
  { code: '45', label: 'Denmark (+45)' },
  { code: '358', label: 'Finland (+358)' },
  { code: '351', label: 'Portugal (+351)' },
  { code: '30', label: 'Greece (+30)' },
  { code: '36', label: 'Hungary (+36)' },
  { code: '40', label: 'Romania (+40)' },
  { code: '380', label: 'Ukraine (+380)' },
  { code: '64', label: 'New Zealand (+64)' },
  { code: '852', label: 'Hong Kong (+852)' },
  { code: '886', label: 'Taiwan (+886)' },
  { code: '255', label: 'Tanzania (+255)' },
  { code: '256', label: 'Uganda (+256)' },
  { code: '250', label: 'Rwanda (+250)' },
  { code: '237', label: 'Cameroon (+237)' },
  { code: '249', label: 'Sudan (+249)' },
  { code: '218', label: 'Libya (+218)' },
  { code: '216', label: 'Tunisia (+216)' },
];

/** Validate local number length (digits only, no country code). */
export function isValidLocalPhoneLength(localDigits: string): boolean {
  const len = localDigits.replace(/\D/g, '').length;
  return len >= 6 && len <= 15;
}

/** Format for display: e.g. +91 98765 43210 */
export function formatPhoneDisplay(phone: string): string {
  const digits = normalizePhone(phone);
  if (digits.length <= 10) return `+${DEFAULT_COUNTRY_CODE} ${digits.slice(0, 5)} ${digits.slice(5)}`;
  const cc = digits.slice(0, -10);
  const rest = digits.slice(-10);
  return `+${cc} ${rest.slice(0, 5)} ${rest.slice(5)}`;
}

/** Validate length (e.g. 10 digits for India without country code, or 12 with +91). */
export function isValidPhoneLength(phone: string): boolean {
  const digits = normalizePhone(phone);
  return digits.length >= 10 && digits.length <= 15;
}
