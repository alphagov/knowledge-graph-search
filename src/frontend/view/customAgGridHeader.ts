import { state } from '../state'
import { SortAction } from '../types/state-types'

interface AgParams {
  menuIcon: string
  displayName: string
  enableMenu: boolean
  enableSorting: boolean
  api: any
  column: {
    isSortAscending: () => boolean
    isSortDescending: () => boolean
    addEventListener: (event: string, callback: any) => void
    removeEventListener: (event: string, callback: any) => void
    getColDef: () => any
    getColId: () => string
  }
  setSort: (order: string, shift: boolean) => void
}

export default class CustomAgGridHeader {
  private agParams!: any
  private eGui!: HTMLElement
  private eHeaderLabel!: HTMLElement
  private sortingState: any
  private initialColDef: any
  private fieldName: string
  private sortable: boolean
  private colId: string

  private onSortRequestedListener: (event: Event) => void
  private onSortChangedListener: (event: Event) => void

  init(agParams: AgParams) {
    this.agParams = agParams
    this.colId = agParams.column.getColId()
    this.initialColDef = this.agParams.column.getColDef()
    this.fieldName = this.initialColDef.field
    this.sortable = this.initialColDef.sortable
    this.sortingState = this.agParams.column.getColDef().sort || SortAction.NONE

    this.eGui = document.createElement('div')
    this.eGui.className = 'customHeaderContainer'
    this.eGui.setAttribute('role', 'presentation')

    this.render()

    this.eHeaderLabel = this.eGui.querySelector('.customHeaderLabel')

    if (this.agParams.enableSorting) {
      this.eHeaderLabel.addEventListener('click', this.notifySort.bind(this))
      this.onSortChangedListener = this.onSortChanged.bind(this)
      this.agParams.column.addEventListener(
        'sortChanged',
        this.onSortChangedListener
      )
      this.agParams.api.addEventListener('sortChanged', () => {
        this.updateText()
      })
      // this.onSortChanged()
      if (this.sortingState) {
        this.agParams.setSort(this.sortingState, false)
      }
    }
  }

  render() {
    this.eGui.innerHTML = `
      <div class="customHeaderLabel ${this.getSortingClass()}" role="presentation">
        ${this.agParams.displayName}
      </div>`
  }

  getSortingClass() {
    if (!this.sortable) {
      return ''
    }

    const prefix = 'sortable'
    const sortingClass =
      {
        [SortAction.ASC]: 'sorting-active sorting-asc',
        [SortAction.DESC]: 'sorting-active sorting-desc',
        [SortAction.NONE]: ' ',
      }[this.sortingState] || ''

    return `${prefix} ${sortingClass}`
  }

  updateSortingClass() {
    const sortingClass = this.getSortingClass()
    this.eHeaderLabel.className = `customHeaderLabel ${sortingClass}`
  }

  notifySort(e: KeyboardEvent) {
    const sortSeq = [SortAction.DESC, SortAction.ASC, SortAction.NONE]
    const updatedSort = sortSeq[(sortSeq.indexOf(this.sortingState) + 1) % 3]
    this.agParams.setSort(updatedSort, e.shiftKey)
  }

  onSortChanged() {
    if (this.agParams.column.isSortAscending()) {
      this.sortingState = SortAction.ASC
    } else if (this.agParams.column.isSortDescending()) {
      this.sortingState = SortAction.DESC
    } else {
      this.sortingState = SortAction.NONE
    }
    this.updateState()
    this.updateSortingClass()
    // this.updateText()
  }

  updateText() {
    let html = this.agParams.displayName

    if (this.hasMultipleSort && this.colId in this.sortModel) {
      html = `${html} <div class="sort-index">(${
        this.sortModel[this.colId].sortIndex + 1
      })</div>`
    }
    this.eHeaderLabel.innerHTML = html
  }

  updateState() {
    state.sorting[this.fieldName] = this.sortingState
  }

  getGui() {
    return this.eGui
  }

  onSortRequested(order: string, event: KeyboardEvent) {
    this.agParams.setSort(order, event.shiftKey)
  }

  destroy() {
    this.eHeaderLabel.removeEventListener('click', this.onSortRequestedListener)
  }

  private get sortModel() {
    return this.agParams.columnApi
      .getColumnState()
      .filter((c) => c.sort !== null)
      .reduce((acc, c) => {
        const { colId, sortIndex, sort } = c
        return { ...acc, [colId]: { sortIndex, sort } }
      }, {})
  }

  private get hasMultipleSort() {
    return Object.values(this.sortModel).length > 1
  }
}
