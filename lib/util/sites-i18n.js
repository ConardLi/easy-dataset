/**
 * Get a localized field from a site object.
 * Supports both new format (object with locale keys) and legacy format (plain string).
 * @param {Object} site - The site object from sites.json
 * @param {string} field - The field name (e.g. 'name', 'description')
 * @param {string} language - The current language code (e.g. 'en', 'zh-CN', 'tr')
 * @returns {string} The localized value
 */
export function getSiteField(site, field, language) {
  const value = site[field];
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[language] || value['en'] || value['zh-CN'] || '';
}
