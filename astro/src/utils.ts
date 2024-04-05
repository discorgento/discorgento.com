/**
 * Formats a given date into a string with the year, month, and day.
 *
 * @param {Date} date - the date to be formatted
 * @return {string} the formatted date string
 */
const formatDate = (date: Date): string => new Date(date).toLocaleDateString(undefined, {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})

/**
 * Capitalizes the first letter of a given string.
 *
 * @param {string} str - the input string to be capitalized
 * @return {string} the capitalized string
 */
const capitalize = (str: string): string => {
  if (typeof str !== 'string') return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export { formatDate, capitalize }