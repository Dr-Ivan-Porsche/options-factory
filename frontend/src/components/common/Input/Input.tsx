import React, { Component, Fragment, createRef, ReactNode } from 'react'
import { twMerge, join } from 'tailwind-merge'
import { BehaviorSubject, Subject, merge, of, fromEvent } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

type Props = {
  label?: string
  defaultValue?: string | number,
  placeholder?: string,
  rootClassName?: string,
  inputClassName?: string,
  className?: string,
  value$?: BehaviorSubject<string>,
  valueLimit?: string,
  errorMessage?: string,
  hasRemoveButton?: boolean,
  hasMaxButton?: boolean,
  disabled?: boolean,
  onChangeCallback?: (...args: any[]) => void
  onBlur?: (a: any) => void
  left?: ReactNode
  right?: ReactNode
}

class Input extends Component<Props> {
  value$: BehaviorSubject<string>

  $input = createRef<HTMLInputElement>()

  destroy$ = new Subject()
  focused$ = new BehaviorSubject(false)

  constructor(props: any) {
    super(props)
    
    // If this.props.value$ does not exists, use local BehaviorSubject
    this.value$ = props.value$ || new BehaviorSubject('')
  }
  
  componentDidMount() {
    merge(
      this.focused$,
      this.value$,
    ).pipe(
      debounceTime(1),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })

    merge(
      fromEvent(this.$input.current as HTMLInputElement, 'focus'),
      fromEvent(this.$input.current as HTMLInputElement, 'blur'),
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe((e) => {
      this.focused$.next(e.type === 'focus')
    })
  }
  
  componentWillUnmount() {
    this.destroy$.next(true)
  }
    
  render() {
    const { 
      label,
      defaultValue,
      placeholder, 
      rootClassName,
      inputClassName,
      className, 
      hasRemoveButton,
      hasMaxButton,
      errorMessage, 
      valueLimit,
      disabled,
      onChangeCallback,
      left,
      right,
      onBlur,
    } = this.props

    return (
      <div className={twMerge("flex flex-col justify-center", rootClassName)}>
        <div
          className={join(
            "group",
            "relative",
            "flex flex-col",
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
            className={twMerge(
              join(
                "flex items-center",
                "relative",
                "w-full dt:w-[100%] h-[40px] pl-[24px]",
                disabled 
                  ? "bg-[#1f2929/30]"
                  : "bg-primary"
              ),
              className
            )}
          >
            {!!left && left}
            <input
              defaultValue={defaultValue}
              ref={this.$input}
              placeholder={placeholder}
              value={typeof this.value$.value === 'undefined' 
                ? defaultValue
                : this.value$.value
              }
              disabled={disabled}
              onBlur={onBlur}
              className={twMerge(
                join(
                  "flex-auto",
                  "w-[100%]",
                  "text-[13px] text-white font-ethica font-normal",
                  "bg-transparent",
                  "pr-[40px]",
                  "outline-none border-none",
                  "opacity-30",
                  (this.value$.value  || defaultValue) && "opacity-100",
                  "focus:opacity-100",
                  "pl-[8px] dt:pl-[unset] placeholder-[#e6e6e6] dt:placeholder-gray",
                ),
                inputClassName,
              )}
              onChange={(e) => { 
                this.value$.next(e.target.value) 

                if (onChangeCallback) {
                  onChangeCallback(e)
                }
              }}
            />
            {!!right && right}
            {hasRemoveButton && !!this.value$.value && (
              <div
                className={join(
                  "flex items-center justify-center",
                  "w-[40px] h-[40px]",
                  "absolute top-[50%] right-0 translate-y-[-50%]",
                  "cursor-pointer"
                )}
                onClick={() => this.value$.next('')}
              >
                <img
                  className={join(
                    "w-[16px] h-[16px]",
                  )}
                  src="/assets/images/remove-x-white.svg"
                />
              </div>
            )}
            {hasMaxButton && valueLimit && (
              <div
                className={join(
                  "flex items-center justify-center",
                  "text-primary text-[11px] font-medium",
                  "absolute top-[50%] right-[8px] translate-y-[-50%]",
                  "cursor-pointer"
                )}
                onClick={() => this.value$.next(valueLimit)}
              >
                Max
              </div>
            )}
          </div>

          <div
            className={join(
              "relative",
              "hidden dt:block h-[1px]",
              "bg-black",
              !disabled && "group-hover:bg-gray",
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

        </div>
        {!!errorMessage && <p className="mt-[3px] text-[11px] font-normal text-red">{errorMessage}</p>}
      </div>
    )
  }
}

export default Input

export type IInput = InstanceType<typeof Input>