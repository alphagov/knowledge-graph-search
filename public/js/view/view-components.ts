const viewFeedbackBanner = function() {
  return `
    <div class="govuk-grid-row feedback-banner">
      <div class="feedback-banner-rule"></div>
      <div class="govuk-grid-column-two-thirds">
        <h2 class="govuk-heading-xl">Help us improve GovGraph</h2>
        <p class="govuk-body">
          Hello, we want to understand how you use Govgraph app to make sure it works well for you and we’d love your feedback. You can tell us about your experience of using the app by completing this short questionnaire. It will take about 5 minutes and most questions are multiple choice.
        </p>
        <p class="govuk-body">
          <a class="govuk-button" href="https://surveys.publishing.service.gov.uk/s/WUKRCT/">View questionnaire</a>
          <button id="dismiss-feedback-banner">Hide this</button>
        </p>
      </div>
    </div>`;
}


const viewMetaLink = (text: String) =>
  `<a class="govuk-link" href="/?selected-words=${encodeURIComponent(`"${text}"`)}">${text}</a>`;


export { viewFeedbackBanner, viewMetaLink };
