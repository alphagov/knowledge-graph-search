import { languageName } from '../../common/utils/lang'

export const formatNames = (array: []) =>
  [...new Set(array)].map((x) => `“${x}”`).join(', ')

export const formatDateTime = (date: any) =>
  `${date.value.slice(0, 10)} at ${date.value.slice(11, 16)}`

export const fieldFormatters: Record<string, any> = {
  url: {
    name: 'URL',
    format: (url: string) => `<a class="govuk-link" href="${url}">${url}</a>`,
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
    name: 'Taxons',
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
    format: (val: string) => (val ? parseInt(val).toString() : '<5'),
  },
  withdrawn_at: {
    name: 'Withdrawn at',
    format: (date: string) => (date ? formatDateTime(date) : 'not withdrawn'),
  },
  withdrawn_explanation: {
    name: 'Withdrawn reason',
    format: (text: string) => text || 'n/a',
  },
}

export const fieldName = function (key: string) {
  const f = fieldFormatters[key]
  return f ? f.name : key
}

export const fieldFormat = function (
  key: string,
  val: string | number
): string {
  const f = fieldFormatters[key]
  return f && f.format ? f.format(val) : val
}
