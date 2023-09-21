import { state } from '../state'
import { fieldName } from '../view/utils'

export const getCurrentPageResults = () => {
  const allPageResults =
    state.searchResults?.slice(
      state.skip,
      state.skip + state.pagination.resultsPerPage
    ) || []

  const showFields = Object.entries(state.showFields)
    .filter(([, show]) => show)
    .map(([field]) => field)

  const filteredFields = allPageResults.map((result) => {
    const filteredResult = {}
    for (const field of showFields) {
      filteredResult[fieldName(field)] = result[field]
    }
    return filteredResult
  })

  return filteredFields
}

export const getAllResults = () => state.searchResults || []

type DateValue = { value: string }

export const convertToCSV = (data: { [key: string]: string | DateValue }[]) => {
  if (data.length === 0) return ''

  const headers = Object.keys(data[0]).join(',')
  const rows = data.map((obj) => {
    return Object.values(obj)
      .map((value) => {
        if (!value) {
          return ''
        }
        if (typeof value === 'object') {
          console.log(value)
          value = (value as DateValue)?.value || value.toString()
        }
        return '"' + value.toString().replace(/"/g, '""') + '"'
      })
      .join(',')
  })

  return [headers, ...rows].join('\n')
}

export const generateFileDownloadFromCSVString = (
  csv: string,
  filename,
) => {
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.style.display = 'none'
  a.href = url
  a.download = filename

  document.body.appendChild(a)
  a.click()

  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}

export const downloadCurrentPageResults = () => {
  const results = getCurrentPageResults()
  const csv = convertToCSV(results)
  generateFileDownloadFromCSVString(csv, 'data-current-results.csv')
}

export const downloadAllPAgeResults = () => {
  const results = getAllResults()
  const csv = convertToCSV(results)
  generateFileDownloadFromCSVString(csv, 'data-all-results.csv')
}
