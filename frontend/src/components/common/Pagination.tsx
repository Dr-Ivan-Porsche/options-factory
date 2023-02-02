import React, { Component, Fragment, createRef } from 'react'
import { twMerge, join } from 'tailwind-merge'
import { BehaviorSubject, Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'
import Gauge from './Gauge'

type Props = {
  page$: BehaviorSubject<number>,
  itemPerPage: number,
  className?: string
  canNext?: boolean
}

class Pagination extends Component<Props> {
  destroy$ = new Subject()
  
  componentDidMount() {
    const { page$ } = this.props
    merge(
      page$,
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
    
  render() {
    const { page$, className, canNext, itemPerPage } = this.props

    const canPrev = page$.value - 1 >= 1

    return (
      <div 
        className={
          join(
            "items-center",
            twMerge(
              "flex",
              className
            )
          )
        }
      >
        <div
          className={join(
            "flex flex-auto justify-center items-center",
            "mr-[12px]",
          )}
        >
          <span className={`font-normal text-[14px] text-gray`}>{((page$.value - 1) * itemPerPage) + 1}</span>
          -
          <span className={`font-normal text-[14px] text-gray`}>{((page$.value - 1) * itemPerPage) + itemPerPage}</span>
        </div>
        <img
          className={join(
            canPrev 
              ? "cursor-pointer"
              : "cursor-not-allowed",
            "w-[24px] h-[24px]"
          )}
          src={canPrev ? "/assets/images/pagination-left.svg" : "/assets/images/pagination-left-disabled.svg"}
          onClick={() => {
            if (!canPrev) return
            page$.next(page$.value - 1)
          }}
        />
        <img 
          className={join(
            canNext
              ? "cursor-pointer"
              : "cursor-not-allowed",
            "w-[24px] h-[24px]"
          )}
          src={canNext ? "/assets/images/pagination-right.svg" : "/assets/images/pagination-right-disabled.svg"}
          onClick={() => {
            if (!canNext) return
            page$.next(page$.value + 1)
          }}
        />
      </div>
    )
  }
}

export default Pagination

export type IPagination = InstanceType<typeof Pagination>