import React, { Component, Fragment, createRef } from 'react'
import { twMerge, join } from 'tailwind-merge'
import { Subject, merge, of, timer } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

type Props = {
  items: any[]
  maxValue: number,
}

class XAxis extends Component<Props> {
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
    const { items, maxValue } = this.props

    return (
      <div 
        style={{
          height: `calc(100% - 37px)`,
        }}
        className={join(
          "absolute bottom-0",
          "flex",
          "w-[100%]",
        )}
      >
        <div className="w-[50px] h-[100%] mr-[12px]" />
        {items.map(({ title, call, put }) => {
          const value1Height = `${(call / maxValue) * 100}%`
          const value2Height = `${(put / maxValue) * 100}%`

          return (
            <div 
              className={join(
                "flex flex-col",
                "items-center",
                // "mt-[6px]",
                "flex-1",
                "text-[13px] font-ethica font-normal text-gray/50",
                "h-[100%]",
              )}
            >
              <div 
                className={join(
                  "flex w-[31px] h-[100%] gap-[3px]",
                  "place-items-end",
                )}
              >
                <div 
                  style={{ height: 0 }}
                  className={join(
                    "bg-green",
                    "flex-1",
                    "transition-all"
                  )}
                  ref={(elem) => {
                    if (!elem) return
                    timer(600).subscribe(() => {
                      elem.style.height = value1Height
                    })
                  }}
                >
                </div>
                <div 
                  style={{ height: 0 }}
                  className={join(
                    "bg-red",
                    "flex-1",
                    "transition-all"
                  )}
                  ref={(elem) => {
                    if (!elem) return
                    timer(300).subscribe(() => {
                      elem.style.height = value2Height
                    })
                  }}
                >
                </div>
              </div>
              <span 
                className={join(
                  "absolute bottom-[-40px]",
                  "rotate-[-30deg]",
                )}
              >
                {title}
              </span>
            </div>
          )
        })}
      </div>
    )
  }
}

export default XAxis

export type IXAxis = InstanceType<typeof XAxis>