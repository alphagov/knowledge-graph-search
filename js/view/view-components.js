const toolTipsText = {
  'content': 'This includes Whitehall summary and Mainstream meta tag description.',
  'link': 'This only looks for links in the body content and not related links.',
  'taxon': 'Searches include the selected topic taxon and all its child taxons.',
  'mainstream': 'Results show under the main guide URL not as individual chapters.',
  'popularity': 'The popularity score is based on the number of onsite links to the page and 3 weeks of Google Analytics traffic. A higher score means greater popularity.'
};


const viewInfoButton = function(id) {
  const text = toolTipsText[id];
  return text ?
    `<img class="info-button" src="assets/images/question-mark.svg" alt="More information" title="${text}"/>`
    : '';
};


export { viewInfoButton };
