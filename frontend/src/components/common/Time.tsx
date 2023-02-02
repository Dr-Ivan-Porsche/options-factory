import React, { Component, Fragment, createRef } from 'react'
import { twMerge, join } from 'tailwind-merge'
import { Subject, merge, of, interval } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

type Props = {
  
}

class Time extends Component<Props> {
  destroy$ = new Subject()
  
  componentDidMount() {
    merge(
      of(true),
    ).pipe(
      debounceTime(1),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })

    interval(1000).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })
  }
  
  componentWillUnmount() {
    this.destroy$.next(true)
  }
    
  render() {
    
    const _date = new Date()
    const time = `${_date.getUTCFullYear()}` 
      + `-${ String(_date.getUTCMonth() + 1).padStart(2, "0")}`
      + `-${ String(_date.getUTCDate()).padStart(2, "0") } `
      + `${String(_date.getUTCHours()).padStart(2, "0")}`
      + `:${String(_date.getUTCMinutes()).padStart(2, "0")}`
      + `:${String(_date.getUTCSeconds()).padStart(2, "0")}`

    return (
      <div className={join(
          "fixed top-0 right-0",
          "flex",
          "w-[160px] h-[20px]",
          "bg-black opacity-50",
          "text-white",
       )}
      >
        {time}
      </div>
    )
  }
}

export default Time

export type ITime = InstanceType<typeof Time>