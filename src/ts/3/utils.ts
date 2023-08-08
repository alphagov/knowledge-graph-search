import { languageName } from './lang';
import { SearchParams, WhereToSearch } from './search-api-types';
import { makeQueryString } from './search-api';

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

const getSortingSelectValue = (selectId: string): string =>
    sanitiseInput((<HTMLElement>id(selectId))?.innerHTML);

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

const formatSorting = {
  pageViewsDesc: 'page views (descending)',
  pageViewsAsc: 'page views (ascending)',
  UpdatedDesc: 'last updated date (descending)',
  UpdatedAsc: 'last updated date (ascending)',
  PublishedDesc: 'published date (descending)',
  PublishedAsc: 'published date (ascending)',
  WithdrawnAtDesc: 'withdrawn date (descending)',
  WithdrawnAtAsc: 'withdrawn date (ascending)',
  TitleAsc: 'page title (alphabetically ascending)',
  TitleDesc: 'page title (alphabetically descending)',
  UrlAsc: 'page url (alphabetically ascending)',
  UrlDesc: 'page url (alphabetically descending)',
  DocumentTypeAsc: 'document type (alphabetically ascending)',
  DocumentTypeDesc: 'document type (alphabetically descending)',
  OccurrencesAsc: 'total occurrences (ascending)',
  OccurrencesDesc: 'total occurrences (descending)'
}

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
  if (search.selectedDocumentType !== '')
    clauses.push(`are of type ${makeBold(search.selectedDocumentType, includeMarkup)}`);
  if (search.selectedLocale !== '')
    clauses.push(`are in ${makeBold(languageName(search.selectedLocale), includeMarkup)}`);
  if (search.linkSearchUrl !== '')
    clauses.push(`contain links to ${makeBold(search.linkSearchUrl, includeMarkup)}`);
  if (search.areaToSearch === 'whitehall' || search.areaToSearch === 'publisher')
    clauses.push(`are published using ${makeBold(search.areaToSearch, includeMarkup)}`);

  const joinedClauses = (clauses.length === 1) ?
    clauses[0] :
    `${clauses.slice(0, clauses.length - 1).join(', ')} and ${clauses[clauses.length - 1]}`;

  return `pages that ${joinedClauses}`;
};


const containDescription = (search: SearchParams, includeMarkup: boolean) => {
  let where: string;
  if (search.whereToSearch === WhereToSearch.All) {
    where = '';
  } else if (search.whereToSearch === WhereToSearch.Title) {
    where = 'in their <strong>title</strong>';
  } else if (search.whereToSearch === WhereToSearch.Description) {
    where = 'in their <strong>description</strong>';
  } else {
    where = 'in their <strong>body content</strong>';
  }
  let combineOp = search.combinator === 'all' ? 'and' : 'or';
  let combinedWords = splitKeywords(search.selectedWords)
    //.filter(w => w.length > 2)
    .map(w => makeBold(w, includeMarkup))
    .join(` ${combineOp} `);
  return search.selectedWords !== '' ? `${combinedWords} ${where}` : '';
};

const makeBold = (text: string, includeMarkup: boolean) =>
  includeMarkup ?
    `<span class="govuk-!-font-weight-bold">${text}</span>` :
    `"${text}"`;

const highlight = (searchTerm: string, text: any): string =>  {

  text = text.replace(/\u00a0/g, ' ');
  let term = searchTerm.replace(/"/g, '');

  let stringToAdd = "<mark class='highlight-bold'>";
  let stringToAddEnd = "</mark>";

  if (term) {
  	let regex = new RegExp(term, 'gi');
    const padding = 50;
    const i = text.toLowerCase().indexOf(term.toLowerCase());
    const iEnd = (i + searchTerm.length)+1

    let origString: any = text;
     origString = origString.split('');
     origString.splice(i, 0, stringToAdd);
     origString.splice(iEnd, 0, stringToAddEnd);
     let  newString = origString.join('');

    if((i+1) >= padding){
      // Add elipse front to end
      return  `&hellip;${newString}&hellip;`;
    } else if( i > -1 && i<padding){
      // Add elipse to end if found at the start of copy
      return `${newString}&hellip;`;
    } else {
      return '';
    }
  }
}

const highlightLinks = (searchTerm: string, links: string[]): string =>  {
  let term = searchTerm.replace(/"/g, '');
  const mark = `<mark class='highlight-bold'>${term}</mark>`;
  let regex = new RegExp(term, 'gi');
  const result = links.find((link: string) => link.includes(term))
  return result ? `<p>${result?.toString().replace(regex, mark)}</p>` : '';
}

const getAnyKeywordSearchUrl = (searchParams: SearchParams) => `${makeQueryString(searchParams)}&combinator=any`;

const paginate = (current: number, max: number) => {
if (!current || !max) return null

let prev = current === 1 ? null : current - 1,
    next = current === max ? null : current + 1,
    items = [1] as any[]

if (current === 1 && max === 1) return {current, prev, next, items}
if (current > 3) items.push('…')

let r = 1, r1 = current - r, r2 = current + r

for (let i = r1 > 2 ? r1 : 2; i <= Math.min(max, r2); i++) items.push(i)

if (r2 + 1 < max) items.push('…')
if (r2 < max) items.push(max)

return {current, prev, next, items}
}


export {
  id,
  sanitiseInput,
  sanitiseOutput,
  getFormInputValue,
  splitKeywords,
  queryDescription,
  getFormSelectValue,
  getSortingSelectValue,
  highlight,
  highlightLinks,
  getAnyKeywordSearchUrl,
  formatSorting,
  paginate
};
