export const makeBold = (text: string, includeMarkup: boolean) =>
  includeMarkup
    ? `<span class="govuk-!-font-weight-bold">${text}</span>`
    : `"${text}"`
