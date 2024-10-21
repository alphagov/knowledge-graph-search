import { languageName } from '../../common/utils/lang'
import { Field } from '../types/state-types'
import { Occurrence } from '../../common/types/search-api-types'

export const formatNames = (array: []) =>
  [...new Set(array)].map((x) => `“${x}”`).join(', ')

export const formatDateTime = (date: any) =>
  date?.value
    ? `${date.value.slice(0, 10)} at ${date.value.slice(11, 16)}`
    : 'No data available'

export const formatOccurrences = (occurrences: Occurrence[]) => {
  if (occurrences.length === 0) {
    return ''
  }
  if (occurrences.length === 1) {
    return `${occurrences[0].occurrences}`
  }
  const occurencesSum = occurrences.reduce(
    (partialSum: any, occurrence: Occurrence) =>
      partialSum + occurrence.occurrences,
    0
  )
  const occurencesFormatted = occurrences
    .map((occurrence) => `${occurrence.keyword} (${occurrence.occurrences})`)
    .join(', ')
  return `Total (${occurencesSum}), ${occurencesFormatted}`
}

export const fieldFormatters: Record<Field, any> = {
  url: {
    name: 'URL',
    format: (url: string) => url,
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
    format: (x: string) => x,
  },
  all_organisations: {
    name: 'All publishing organisations',
    format: formatNames,
  },
  page_views: {
    name: 'Views (7days)',
    format: (val: string) => (val ? parseInt(val).toString() : 'less than 5'),
  },
  withdrawn_at: {
    name: 'Withdrawn at',
    format: (date: string) => (date ? formatDateTime(date) : 'not withdrawn'),
  },
  withdrawn_explanation: {
    name: 'Withdrawn reason',
    format: (text: string) => text || 'No data available',
  },
  occurrences: {
    name: 'Occurrences',
    format: formatOccurrences,
  },
  government: { name: 'Government' },
  is_political: { name: 'Is political' },
  people: { name: 'Associated People', format: formatNames },
}

export const fieldName = function (key: string) {
  const f = fieldFormatters[<Field>key]
  return f ? f.name : key
}

export const fieldFormat = function (
  key: string,
  val: string | number
): string {
  const f = fieldFormatters[<Field>key]
  return f && f.format ? f.format(val) : val
}

export const dispatchCustomGAEvent = (name: string, detail: any = {}) => {
  // @ts-ignore
  if (window.dataLayer) {
    // @ts-ignore
    window.dataLayer.push({
      event: name,
      ...detail,
    })
  }
}

export const sortOrder = function (key: string) {
  const sortOrderFormatters: Record<string, any> = {
    asc: {
      name: 'ascending',
    },
    desc: {
      name: 'descending',
    },
  }
  const s = sortOrderFormatters[key]
  return s ? s.name : key
}
