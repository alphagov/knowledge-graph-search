import { stringify } from 'csv-stringify/sync'
import { languageName } from './src/ts/lang';


// turn an array of strings (from db results) into a string (for human-friendly
// display)
const formatNames = (array: string[]):string =>
  array.length === 1
    ? array[0] // if there's only one element just output it
    : [...new Set(array)].map(x => `“${x}”`).join(', '); // otherwise dedupe


const formatDateTime = (date: any) =>
  `${date.value.slice(0, 10)} at ${date.value.slice(11, 16)}`;


// Used when the value doesn't need to be modified
const identity = (val:string):string => val

// This is almost like the function that formats the HTML table, except
// for the url field, which doesn't need an HTML link
const csvFieldFormatters: Record<string, any> = {
  'url': {
    name: 'URL',
    format: identity
  },
  'title': { name: 'Title' },
  'locale': { name: 'Language', format: languageName },
  'documentType': { name: 'Document type' },
  'publishing_app': { name: 'Publishing app' },
  'first_published_at': {
    name: 'First published',
    format: formatDateTime
  },
  'public_updated_at': {
    name: 'Last major update',
    format: formatDateTime,
  },
  'taxons': {
    name: 'Taxons',
    format: formatNames
  },
  'primary_organisation': {
    name: 'Primary publishing organisation',
    format: identity
  },
  'all_organisations': {
    name: 'All publishing organisations',
    format: formatNames
  },
  'pagerank': {
    name: 'Popularity',
    format: (val: string):string => val ? parseFloat(val).toFixed(2) : 'n/a'
  },
  'withdrawn_at': {
    name: 'Withdrawn at',
    format: (date: string) => date ? formatDateTime(date) : "not withdrawn"
  },
  'withdrawn_explanation': {
    name: 'Withdrawn reason',
    format: (text: string) => text || 'n/a'
  }
};

// generate a human-readable string depending on the type of field
// (url, title, publishing app, etc)
const fieldFormat = function(key: string, val: any):string {
  const f = csvFieldFormatters[key];
  return (f && f.format) ? f.format(val) : val;
};

// generate a human-readable string for the CSV header depending on
// the name of the field (url, title, publishing_app, etc)
const fieldName = function(key: string) {
  const f = csvFieldFormatters[key];
  return f ? f.name : key;
};

// generate a lookup object with all the header names and their
// human-readable version
const makeHeaders = function(obj:Record<string, any>) {
  const result:Record<string, string> = {};

  Object.keys(obj).forEach((key:any) => {
    result[key] = fieldName(key);
  });

  return result;
};

// generates a copy of the passed array of results with all fields modified to
// be human-readable
const formatForCsv = function(lines:any) {
  const headers = makeHeaders(lines[0])
  const body = lines
    .sort((a:any, b:any) => parseFloat(b.pagerank) - parseFloat(a.pagerank))
    .map((record:any) => {
      const formattedRowObj:any = {}
      for (const [key, value] of Object.entries(record)) {
        formattedRowObj[key] = value ? fieldFormat(key, value) : '';
      }
      return formattedRowObj;
    });
  return body;
};

// top-level function - make a CSV from a results oject
const csvStringify = function(object: any) {
  const formattedObject:any = formatForCsv(object);
  return stringify(formattedObject, { header: true });
};


export { csvStringify }
