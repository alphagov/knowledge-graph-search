const viewMetaLink = (text: String) =>
  `<a class="govuk-link" href="/?selected-words=${encodeURIComponent(`"${text}"`)}">${text}</a>`;


export { viewMetaLink };
