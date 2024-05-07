import { stringify } from 'csv-stringify/sync'
import { languageName } from '../../common/utils/lang'

// turn an array of strings (from db results) into a string (for human-friendly
// display)
const formatNames = (array: string[]): string =>
  array.length === 1
    ? array[0] // if there's only one element just output it
    : [...new Set(array)].map((x) => `“${x}”`).join(', ') // otherwise dedupe

const formatDateTime = (date: any) =>
  `${date.value.slice(0, 10)} at ${date.value.slice(11, 16)}`

// Used when the value doesn't need to be modified
const identity = (val: string): string => val

// This is almost like the function that formats the HTML table, except
// for the url field, which doesn't need an HTML link
const csvFieldFormatters: Record<string, any> = {
  url: {
    name: 'URL',
    format: identity,
  },
  title: { name: 'Title' },
  locale: { name: 'Language', format: languageName },
  documentType: { name: 'Document type' },
  contentId: { name: 'Content ID' },
  publishing_app: { name: 'Publishing app' },
  first_published_at: {
    name: 'First published',
    format: formatDateTime,
  },
  public_updated_at: {
    name: 'Last major update',
    format: formatDateTime,
  },
  taxons: {
    name: 'Topic tags',
    format: formatNames,
  },
  primary_organisation: {
    name: 'Primary publishing organisation',
    format: identity,
  },
  all_organisations: {
    name: 'All publishing organisations',
    format: formatNames,
  },
  page_views: {
    name: 'Page views',
    format: (val: string): string =>
      val ? parseInt(val).toString() : 'less than 5',
  },
  withdrawn_at: {
    name: 'Withdrawn at',
    format: (date: string) => (date ? formatDateTime(date) : 'not withdrawn'),
  },
  withdrawn_explanation: {
    name: 'Withdrawn reason',
    format: (text: string) => text || 'No data available',
  },
  occurrences: { name: 'Occurrences' },
  government: { name: 'Government' },
  is_political: { name: 'Is political' },
}

// generate a human-readable string depending on the type of field
// (url, title, publishing app, etc)
const fieldFormat = function (key: string, val: any): string {
  const f = csvFieldFormatters[key]
  return f && f.format ? f.format(val) : val
}

// generates a copy of the passed array of results with all fields modified to
// be human-readable
const formatForCsv = function (lines: any) {
  const body = lines
    .sort((a: any, b: any) => parseInt(b.page_views) - parseInt(a.page_views))
    .map((record: any) => {
      const formattedRowObj: any = {}
      for (const [key, value] of Object.entries(record)) {
        formattedRowObj[key] = value ? fieldFormat(key, value) : ''
      }
      return formattedRowObj
    })
  return body
}

// top-level function - make a CSV from a results oject
const csvStringify = function (object: any) {
  const formattedObject: any = formatForCsv(object)
  return stringify(formattedObject, { header: true })
}

export { csvStringify }
