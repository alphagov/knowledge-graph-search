export const formatDocumentType = (documentType: string) =>
  (documentType.charAt(0).toUpperCase() + documentType.slice(1)).replace(
    /_/g,
    ' '
  )

export const formatPublishingApp = (publishingApp: string) =>
  publishingApp.charAt(0).toUpperCase() + publishingApp.slice(1)
