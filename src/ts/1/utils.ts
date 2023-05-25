import { languageName } from './lang';
import { SearchParams, WhereToSearch } from './search-api-types';

const id = (x: string): (HTMLElement | null) => document.getElementById(x);


const tagBody: string = '(?:[^"\'>]|"[^"]*"|\'[^\']*\')*';


const tagOrComment: RegExp = new RegExp(
  '<(?:'
  // Comment body.
  + '!--(?:(?:-*[^->])*--+|-?)'
  // Special "raw text" elements whose content should be elided.
  + '|script\\b' + tagBody + '>[\\s\\S]*?</script\\s*'
  + '|style\\b' + tagBody + '>[\\s\\S]*?</style\\s*'
  // Regular name
  + '|/?[a-z]'
  + tagBody
  + ')>',
  'gi');


const getFormInputValue = (inputId: string): string =>
  sanitiseInput((<HTMLInputElement>id(inputId))?.value);

const getFormSelectValue = (selectId: string): string =>
    sanitiseInput((<HTMLSelectElement>id(selectId))?.selectedOptions[0].value);


const sanitiseInput = function(text: string): string {
  // remove text that could lead to script injections
  if (!text) return '';
  text = text.trim();
  let oldText: string;
  do {
    oldText = text;
    text = text.replace(tagOrComment, '');
  } while (text !== oldText);
  return text.replace(/</g, '&lt;').replace(/""*/g, '"');
};


const sanitiseOutput = function(text: string): string {
  const escapeHTML = (str: string) => new Option(str).innerHTML;
  return escapeHTML(text)
    .replace(/'/g, '&apos;')
    .replace(/"/g, '&quot;')
};


const splitKeywords = function(keywords: string): string[] {
  const wordsToIgnore = ['of', 'for', 'the', 'or', 'and'];
  const regexp = /[^\s,"]+|"([^"]*)"/gi;
  const output = [];
  let match: (RegExpExecArray | null);
  do {
    match = regexp.exec(keywords);
    if (match) {
      output.push(match[1] ? match[1] : match[0]);
    }
  } while (match);
  return output.filter(d => d.length > 0 && !wordsToIgnore.includes(d));
};


const queryDescription = (search: SearchParams, includeMarkup = true) => {
  const clauses = [];
  if (search.selectedWords !== '') {
    let keywords = `contain ${containDescription(search, includeMarkup)}`;
    if (search.excludedWords !== '') {
      keywords = `${keywords} (but don't contain ${makeBold(search.excludedWords, includeMarkup)})`;
    }
    clauses.push(keywords);
  }
  if (search.selectedTaxon !== '')
    clauses.push(`belong to the ${makeBold(search.selectedTaxon, includeMarkup)} taxon (or its sub-taxons)`);
  if (search.selectedOrganisation !== '')
    clauses.push(`are published by the ${makeBold(search.selectedOrganisation, includeMarkup)}`);
  if (search.selectedLocale !== '')
    clauses.push(`are in ${makeBold(languageName(search.selectedLocale), includeMarkup)}`);
  if (search.linkSearchUrl !== '')
    clauses.push(`link to ${makeBold(search.linkSearchUrl, includeMarkup)}`);
  if (search.areaToSearch === 'whitehall' || search.areaToSearch === 'publisher')
    clauses.push(`are published using ${makeBold(search.areaToSearch, includeMarkup)}`);

  const joinedClauses = (clauses.length === 1) ?
    clauses[0] :
    `${clauses.slice(0, clauses.length - 1).join(', ')} and ${clauses[clauses.length - 1]}`;

  return `pages that ${joinedClauses}`;
};


const containDescription = (search: SearchParams, includeMarkup: boolean) => {
  let where: string;
  //if (search.whereToSearch.title && search.whereToSearch.text) {
  if (search.whereToSearch === WhereToSearch.All) {
    where = '';
  //} else if (search.whereToSearch.title) {
  } else if (search.whereToSearch === WhereToSearch.Title) {
    where = 'in their title';
  } else {
    where = 'in their body content';
  }
  let combineOp = search.combinator === 'all' ? 'and' : 'or';
  let combinedWords = splitKeywords(search.selectedWords)
    .filter(w => w.length > 2)
    .map(w => makeBold(w, includeMarkup))
    .join(` ${combineOp} `);
  return search.selectedWords !== '' ? `${combinedWords} ${where}` : '';
};

const makeBold = (text: string, includeMarkup: boolean) =>
  includeMarkup ?
    `<span class="govuk-!-font-weight-bold">${text}</span>` :
    `"${text}"`;

    const highlight = (searchTerm: string, text: string): string =>  {
      text = text.replace(/\u00a0/g, ' ');
      let term = searchTerm.replace(/['"]+/g, '');
      const mark = `<mark class='highlight'>${term}</mark>`;
      if (term) {
      	let regex = new RegExp(term, 'gi');
        const padding = 50;
        const i = text.indexOf(term);
        //TODO: handle ignored case matching
        if(i>padding){
            //trims left annd right
            const trimLeft = text.substr(i - padding);
            const trimRight = trimLeft.substr(0, trimLeft.indexOf(term) + term.length+padding);
            return `<p>&hellip;${trimRight.replace(regex, mark)}&hellip;</p>`;
        } else if( i > -1 && i<padding){
            //only trims right if found at the start of copy
            const trimRight = text.substr(0, text.indexOf(term) + term.length+(padding*2));
          return `<p>${trimRight.replace(regex, mark)}&hellip;</p>`;
        } else {
          return '';
        }
      }
    }


export { id, sanitiseInput, sanitiseOutput, getFormInputValue, splitKeywords, queryDescription, getFormSelectValue, highlight };
