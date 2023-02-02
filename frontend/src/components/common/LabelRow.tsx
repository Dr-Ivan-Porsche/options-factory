import React, { Component, Fragment, createRef } from 'react'
import { twMerge, join } from 'tailwind-merge'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

type Props = {
  title: string,
  value: any,
}

class LabelRow extends Component<Props> {
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
  }
  
  componentWillUnmount() {
    this.destroy$.next(true)
  }
    
  render() {
    const { title, value } = this.props
    return (
      <div className={join(
          "flex",
          "w-[100%]",
          "justify-between",
          "pl-[16px]",
          "mb-[4px]",
          "border-l-[3px] border-[rgba(116,119,128,0.5)]",
       )}
      >
        <span
          className={join(
            "text-[16px] text-bold text-gray leading-[24px]",
          )}
        >
          {title}
        </span>
        <div className={join(
          "text-[16px] font-normal text-gray text-right leading-[24px]",
        )}>
          {value}
        </div>
      </div>
    )
  }
}

export default LabelRow

export type ILabelRow = InstanceType<typeof LabelRow>