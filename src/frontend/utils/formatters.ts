export const formatDocumentType = (documentType: string) =>
  (documentType.charAt(0).toUpperCase() + documentType.slice(1)).replace(
    /_/g,
    ' '
  )

/*
 * First letter of each word capitalised and all underscores and dashes replaced with spaces.
 */
export const formatPublishingApp = (phrase: string) =>
  phrase
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
