const viewMetaLink = (text: string, extraClasses = '') =>
  `<a class="govuk-link ${extraClasses}" href="/?selected-words=${encodeURIComponent(
    `"${text}"`
  )}">${text}</a>`

export { viewMetaLink }
