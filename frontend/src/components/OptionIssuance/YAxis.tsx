import React, { Component, Fragment, createRef } from 'react'
import { twMerge, join } from 'tailwind-merge'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'
import { range } from 'lodash'

type Props = {
  offset: number,
  maxValue: number,
}

class YAxis extends Component<Props> {
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
    const { offset, maxValue } = this.props

    const lineCount = Math.floor(maxValue / offset)

    return (
      <div className={join(
          "flex flex-col",
          "w-[100%] h-[100%]",
       )}
      >
        {range(lineCount, -1).map((i) => {
          return (
            <div 
              className={twMerge(
                join(
                  "flex flex-1",
                  "items-end",
                ),
              )}
            >
              <span 
                className={twMerge(
                  join(
                    "relative",
                    "w-[45px]",
                    "text-[13px] font-ethica font-normal text-gray/50 text-right",
                    "top-[8px]",
                  ),
                )}
              >
                {(i * offset).toFixed(0)}
              </span>
              <div 
                className={join(
                  "flex-auto h-[1px] bg-[rgba(116,119,128,0.5)]",
                  "ml-[12px]",
                )}
              />
            </div>
          )
        })}
      </div>
    )
  }
}

export default YAxis

export type IYAxis = InstanceType<typeof YAxis>