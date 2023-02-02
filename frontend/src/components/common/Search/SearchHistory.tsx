import React, { Component, Fragment, createRef } from 'react'
import { twMerge, join } from 'tailwind-merge'
import { Subject, merge, of, BehaviorSubject } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

type Props = {
  isShow$: BehaviorSubject<boolean>,
  history$: BehaviorSubject<any[]>,
  onHistorySelect?: (item: any) => void,
}

class SearchHistory extends Component<Props> {
  destroy$ = new Subject()
  
  componentDidMount() {
    const { isShow$, history$ } = this.props

    merge(
      isShow$,
      history$,
    ).pipe(
      debounceTime(1),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })
  }
  
  componentWillUnmount() {
    this.destroy$.next(true)
  }

  empty = () => {
    const { history$ } = this.props
    history$.next([])
  }
    
  render() {
    const { isShow$, history$, onHistorySelect } = this.props

    const history = history$.value

    return isShow$.value && (
      <div className={join(
          "flex flex-col",
          "w-[100%] h-[100%]",
          "p-[14px]",
          "border border-[rgba(255,255,255,.2)]"
       )}
      >
        <div
          className={join(
            "flex justify-between",
            "text-[12px] text-darkgray font-normal",
            "mb-[12px]",
          )}
        >
          <span>Recent</span>
          <div className="flex items-center">
            <button onClick={this.empty} className="underline cursor-pointer mr-[12px]">Empty</button>
            <button onClick={() => isShow$.next(false)} className="underline cursor-pointer">Close</button>
          </div>
        </div>
        {history.map(({ title, contractAddress }) => {
          return (
            <div 
              className="flex justify-between mb-[6px] cursor-pointer"
            >
              <span
                onClick={() => {
                  if (typeof onHistorySelect === 'function') {
                    onHistorySelect({ title, contractAddress })
                  }
                  isShow$.next(false)
                }}
                className="text-[14px] text-gray font-normal"
              >
                {title}
              </span>
              <img 
                className="w-[16px] h-[16px]" 
                src="/assets/images/remove-x.svg"
                onClick={() => {
                  history$.next(
                    history$.value.filter((historyItem) => contractAddress !== historyItem.contractAddress)
                  )
                }}
              />
            </div>
          )
        })}
      </div>
    )
  }
}

export default SearchHistory

export type ISearchHistory = InstanceType<typeof SearchHistory>