import { state } from '../state'
import { SortAction } from '../types/state-types'

interface AgParams {
  menuIcon: string
  displayName: string
  enableMenu: boolean
  enableSorting: boolean
  column: {
    isSortAscending: () => boolean
    isSortDescending: () => boolean
    addEventListener: (event: string, callback: any) => void
    removeEventListener: (event: string, callback: any) => void
    getColDef: () => any
  }
  setSort: (order: string, shift: boolean) => void
}

export default class CustomAgGridHeader {
  private agParams!: AgParams
  private eGui!: HTMLElement
  private eHeaderLabel!: HTMLElement
  private sortingState: any
  private initialColDef: any
  private fieldName: string
  private sortable: boolean

  private onSortRequestedListener: (event: Event) => void

  init(agParams: AgParams) {
    this.agParams = agParams
    this.initialColDef = this.agParams.column.getColDef()
    this.fieldName = this.initialColDef.field
    this.sortable = this.initialColDef.sortable
    this.sortingState = this.agParams.column.getColDef().sort || SortAction.NONE
    if (this.fieldName === 'page_views') {
      console.log({ initialSortingState: this.sortingState })
    }

    this.eGui = document.createElement('div')

    this.render()

    this.eHeaderLabel = this.eGui.querySelector('.customHeaderLabel')

    if (this.agParams.enableSorting) {
      this.eHeaderLabel.addEventListener('click', this.notifySort.bind(this))
    }
  }

  render() {
    this.eGui.innerHTML = `
      <div class="customHeaderLabel ${this.getSortingClass()}">${
      this.agParams.displayName
    }</div>
        `
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
    console.log('notifySort()', { sortingState: this.sortingState })
    const sortSeq = [SortAction.DESC, SortAction.ASC, SortAction.NONE]
    const updatedSort = sortSeq[(sortSeq.indexOf(this.sortingState) + 1) % 3]
    console.log({ updatedSort })
    this.agParams.setSort(updatedSort, e.shiftKey)
    this.onSortChanged()
  }

  onSortChanged() {
    console.log('onSortChanged()')
    if (this.agParams.column.isSortAscending()) {
      console.log('changed to asc')
      this.sortingState = SortAction.ASC
    } else if (this.agParams.column.isSortDescending()) {
      console.log('changed to desc')
      this.sortingState = SortAction.DESC
    } else {
      console.log('changed to none')
      this.sortingState = SortAction.NONE
    }
    this.updateState()
    this.updateSortingClass()
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
}
