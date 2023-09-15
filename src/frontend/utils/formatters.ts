export const formatDocumentType = (documentType: string) =>
  (documentType.charAt(0).toUpperCase() + documentType.slice(1)).replace(
    /_/g,
    ' '
  )
