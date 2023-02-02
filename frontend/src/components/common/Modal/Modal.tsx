import React, { Component, Fragment, createRef, ReactNode } from 'react'
import { twMerge, join } from 'tailwind-merge'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'
import { closeModal$ } from '../../../streams/ui'

type Props = {
  className?: string,
  children?: ReactNode
  zIndex?: number,
  dimmed?: boolean
}

class Modal extends Component<Props> {
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
    const { className, children, zIndex, dimmed } = this.props
    return (
      <div 
        style={{ zIndex }}
        className={twMerge(
          join(
            "fixed",
            "top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]",
            "w-[100%] h-[418px] dt:w-[636px]",
            "pt-[36px] px-[48px]",
            "border border-white/20 bg-darkgray",
            "rounded-[8px]",
            "flex flex-col",
            "overflow-scroll",
          ),
          className
        )}
      >
        {children}
        {dimmed && (
          <div
            onClick={() => closeModal$.next(true)}
            className={join(
              "flex",
              "absolute left-0 top-0 w-[100%] h-[100%]",
              "backdrop-blur",
              "cursor-pointer"
            )} 
          />
        )}
      </div>
    )
  }
}

export default Modal

export type IModal = InstanceType<typeof Modal>