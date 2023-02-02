import React, { Component, Fragment, createRef, ReactNode } from 'react'
import { Subject, merge, of, BehaviorSubject, fromEvent } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'
import { join, twMerge } from 'tailwind-merge'

type Props = {
  label?: string
  className?: string
  day$?: BehaviorSubject<string> 
  month$?: BehaviorSubject<string> 
  year$?: BehaviorSubject<string>
  hours$?: BehaviorSubject<string>
  minutes$?: BehaviorSubject<string>
  seconds$?: BehaviorSubject<string>

  right?: ReactNode
}

class ExpiryInput extends Component<Props> {
  listened: any = {}

  $input = createRef<HTMLInputElement>()

  destroy$ = new Subject()

  focused$ = new BehaviorSubject(false)

  componentDidMount() {
    merge(
      this.focused$,
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

  listenInput = (elem: HTMLInputElement, key: string) => {
    if (!elem) return
    
    this.listened[key] = true
    
    merge(
      fromEvent(elem as HTMLInputElement, 'focus'),
      fromEvent(elem as HTMLInputElement, 'blur'),
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe((e) => {
      this.focused$.next(e.type === 'focus')
    })
  }

  render() {
    const { 
      label,
      className,
      day$, 
      month$, 
      year$,
      hours$,
      minutes$,
      seconds$,
      right,
    } = this.props

    const errorMessage = ""

    return (
      <div 
        className={twMerge(
          join(
            "flex",
            "flex-col",
          ),
          className,
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
        <div className="flex items-center bg-primary px-[24px] h-[64px]">
          {day$ && month$ && year$ && (
            <>
              <input
                ref={(elem: HTMLInputElement) => {
                  this.listenInput(elem, 'dd')
                }}
                style={{ width: "28px" }}
                placeholder="dd"
                onChange={(e) => {
                  if (e.target.value.length > 2) {
                    return
                  }
                  day$.next(e.target.value)
                }}
                value={day$.value}
                className={join(
                  "font-ethica font-bold text-[22px] text-gray",
                  "bg-primary",
                  "outline-none",
                  "placeholder-gray/20"
                )}
              />
              <span
                className={join(
                  "text-[16px] text-gray/50",
                  "mx-[12px]"
                )}
              >
                /
              </span>
              <input
                ref={(elem: HTMLInputElement) => {
                  this.listenInput(elem, 'mm')
                }}
                style={{ width: "40px" }}
                placeholder="mm"
                onChange={(e) => {
                  if (e.target.value.length > 2) {
                    return
                  }
                  month$.next(e.target.value)
                }}
                value={month$.value}
                className={join(
                  "font-ethica font-bold text-[22px] text-gray",
                  "bg-primary",
                  "outline-none",
                  "placeholder-gray/20"
                )}
              />
              <span
                className={join(
                  "text-[16px] text-gray/50",
                  "mx-[12px]"
                )}
              >
                /
              </span>
              <input
                ref={(elem: HTMLInputElement) => {
                  this.listenInput(elem, 'yyyy')
                }}
                style={{ width: "80px" }}
                placeholder="yyyy"
                onChange={(e) => {
                  if (e.target.value.length > 4) {
                    return
                  }
                  year$.next(e.target.value)
                }}
                value={year$.value}
                className={join(
                  "font-ethica font-bold text-[22px] text-gray",
                  "bg-primary",
                  "outline-none",
                  "placeholder-gray/20"
                )}
              />
            </>
          )}
          {hours$ && minutes$ && seconds$ && (
            <>
              <input
                ref={(elem: HTMLInputElement) => {
                  this.listenInput(elem, '_hh')
                }}
                style={{ width: "28px" }}
                placeholder="hh"
                onChange={(e) => {
                  if (e.target.value.length > 2) {
                    return
                  }
                  hours$.next(e.target.value)
                }}
                value={hours$.value}
                className={join(
                  "font-ethica font-bold text-[22px] text-gray",
                  "bg-primary",
                  "outline-none",
                  "placeholder-gray/20"
                )}
              />
              <span
                className={join(
                  "text-[16px] text-gray/50",
                  "mx-[12px]"
                )}
              >
                :
              </span>
              <input
                ref={(elem: HTMLInputElement) => {
                  this.listenInput(elem, '_mm')
                }}
                style={{ width: "40px" }}
                placeholder="mm"
                onChange={(e) => {
                  if (e.target.value.length > 2) {
                    return
                  }
                  minutes$.next(e.target.value)
                }}
                value={minutes$.value}
                className={join(
                  "font-ethica font-bold text-[22px] text-gray",
                  "bg-primary",
                  "outline-none",
                  "placeholder-gray/20"
                )}
              />
              <span
                className={join(
                  "text-[16px] text-gray/50",
                  "mx-[12px]"
                )}
              >
                :
              </span>
              <input
                ref={(elem: HTMLInputElement) => {
                  this.listenInput(elem, '_ss')
                }}
                style={{ width: "80px" }}
                placeholder="ss"
                onChange={(e) => {
                  if (e.target.value.length > 4) {
                    return
                  }
                  seconds$.next(e.target.value)
                }}
                value={seconds$.value}
                className={join(
                  "font-ethica font-bold text-[22px] text-gray",
                  "bg-primary",
                  "outline-none",
                  "placeholder-gray/20"
                )}
              />
            </>
          )}

          <div
            className={join(
              "relative",
              "hidden dt:block h-[1px]",
              "bg-black",
              "group-hover:bg-gray",
            )}
          >
            <div
              className={join(
                "absolute bottom-0 left-0",
                "h-[1px]",
                (this.focused$.value || errorMessage) ? "w-[100%]" : "w-0",
                errorMessage ? "bg-red" : "bg-skyblue",
                "transition-width duration-[250ms]"
              )}
            />
          </div>
          
          {!!right && right}
        </div>
      </div>
    )
  }
}

export default ExpiryInput