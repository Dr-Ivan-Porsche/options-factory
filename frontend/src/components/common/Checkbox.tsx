import React, { Component, Fragment, createRef } from 'react'
import { twMerge, join } from 'tailwind-merge'
import { Subject, merge, of, BehaviorSubject } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

type Props = {
  checked$: BehaviorSubject<boolean>
  title?: string,
}

class Checkbox extends Component<Props> {
  destroy$ = new Subject()

  componentDidMount() {
    const { checked$ } = this.props
    merge(
      checked$,
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
    const { title, checked$ } = this.props
    return (
      <div
        onClick={() => {
          checked$.next(!checked$.value)
        }}
        className={join(
          "flex",
          "h-[100%]",
          "cursor-pointer",
          "items-center",
       )}
      >
        {checked$.value 
          ? <img className="w-[24px] h-[24px]" src="/assets/images/checked.svg" />
          : <img className="w-[24px] h-[24px]" src="/assets/images/unchecked.svg" />
        }
        <span 
          className={join(
            "text-[14px] font-bold text-gray",
            "ml-[12px]"
          )}
        >
          {title}
        </span>
      </div>
    )
  }
}

export default Checkbox

export type ICheckbox = InstanceType<typeof Checkbox>