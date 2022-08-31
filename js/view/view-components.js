const toolTipsText = {
  'content': 'This includes Whitehall summary and Mainstream meta tag description.',
  'link': 'This only looks for links in the body content and not related links.',
  'taxon': 'Searches include the selected topic taxon and all its child taxons.',
  'mainstream': 'Results show under the main guide URL not as individual chapters.',
  'popularity': 'The popularity score is based on the number of onsite links to the page and 3 weeks of Google Analytics traffic. A higher score means greater popularity.'
};

const viewFeedbackBanner = function() {
  return `
    <div class="govuk-grid-row feedback-banner">
      <div class="feedback-banner-rule"></div>
      <div class="govuk-grid-column-one-half">
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


const viewMetaLink = text =>
  `<a class="govuk-link" href="/?selected-words=${encodeURIComponent(`"${text}"`)}">${text}</a>`;


export { viewFeedbackBanner, viewMetaLink };
