import React, { Component, Fragment, createRef } from 'react'
import { twMerge, join } from 'tailwind-merge'
import { BehaviorSubject, Subject, merge, of, fromEvent } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

type Props = {
  selected: any,
  items: any[]
  label?: string
  className?: string,
}

class Dropdown extends Component<Props> {
  $container = createRef<HTMLDivElement>()

  destroy$ = new Subject()
  isOpened$ = new BehaviorSubject(false)
  
  componentDidMount() {
    merge(
      this.isOpened$,
    ).pipe(
      debounceTime(1),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })

    fromEvent(window, 'click').pipe(
      takeUntil(this.destroy$)
    ).subscribe((e) => {
      if (e.target !== this.$container.current) {
        this.isOpened$.next(false)
      }
    })
  }
  
  componentWillUnmount() {
    this.destroy$.next(true)
  }
    
  render() {
    const { label, items, selected, className } = this.props

    return (
      <div
        className={join(
          "flex flex-col flex-1",
        )}
      >
        {label && (
            <p
              className={join(
                "text-[14px] text-gray font-bold",
                "mb-[20px]",
              )}
            >
              {label}
            </p>
          )}
        <div
          ref={this.$container}
          className={
            twMerge(
              join(
                "flex",
                "items-center",
                "relative",
                "h-[64px]",
                "px-[24px] py-[12px]",
                "bg-primary",
                "font-normal font-ethica text-[22px] text-gray",
                "cursor-pointer",
              ),
              className
            )
        }
          onClick={() => this.isOpened$.next(!this.isOpened$.value)}
        >
          {selected.title}
          <img
            className="w-[36px] h-[24px] absolute right-[20px] top-[50%] -translate-y-[50%]"
            src={this.isOpened$.value 
                ? "/assets/images/dropdown-up.svg"
                : "/assets/images/dropdown-down.svg"
            }
          />
          {this.isOpened$.value && (
            <div
              style={{
                top: "calc(100% + 8px)",
              }}
              className={join(
                "absolute left-0",
                "w-[100%] h-[300px]",
                "overflow-scroll",
                "font-ethica",
                "px-[10px] pt-[34px] pb-[18px]",
                "bg-darkgreen",
                "shadow-[0_80px_60px_0_rgba(0,0,0,0.2)]",
                "z-10",
                "rounded-[12px]",
                "shadow-[0_6px_16px_0_rgba(0,0,0,0.5)]",
              )}
            >
              {items.map(({ key, title, onClick }) => {
                const isSelected = selected.key == key
                return (
                  <div
                    onClick={onClick}
                    className={join(
                      "flex items-center",
                      "h-[38px]",
                      "px-[16px] py-[8px]",
                      "rounded-[6px]",
                      "font-normal text-[18px]",
                      ["hover:bg-jade/50", "hover:text-white2"],
                      isSelected
                        ? ["!bg-jade", "text-gray"]
                        : "text-gray",
                    )}
                  >
                    {title}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }
}

export default Dropdown

export type IDropdown = InstanceType<typeof Dropdown>