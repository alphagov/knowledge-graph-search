const viewMetaLink = (text: String, extraClasses: String = '') =>
  `<a class="govuk-link ${extraClasses}" href="/?selected-words=${encodeURIComponent(`"${text}"`)}">${text}</a>`;


export { viewMetaLink };
