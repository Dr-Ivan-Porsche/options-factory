import React, { Component, Fragment, createRef } from 'react'
import { twMerge, join } from 'tailwind-merge'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'
import Circle from './Circle'

type Props = {
  list: any[]
  selectedKey?: string
  className?: string
}

class RadioList extends Component<Props> {

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
    const { list, selectedKey, className } = this.props

    return (
      <div 
        className={twMerge(
          join(
            "flex",
            "w-[100%]",
            "items-center",
            "gap-x-[20px]"
          ),
          className
        )}
      >
        {list.map(({ label, key, value, onClick }) => {
          const isActive = selectedKey == key

          return (
            <div
              key={label}
              className={join(
                "flex",
                "flex-1",
                "items-center",
                // "w-[100%]",
                "h-[108px]",
                "bg-primary",
                "rounded-[5px]",
                "text-dove",
                "text-[24px]",
                "font-bold",
                "h-[108px]",
                "pl-[28px]",
                "cursor-pointer",
                "border-[1px]",
                isActive 
                  ? "border-color-dove"
                  : "border-transparent",
              )}
              onClick={() => {
                onClick()
              }}
            >
              <Circle 
                active={isActive}
                className="mr-[40px]"
              />
              {value}
            </div>
          )
        })}
      </div>
    )
  }
}

export default RadioList