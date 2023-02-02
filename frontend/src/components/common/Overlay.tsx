import React, { Component, Fragment, createRef, cloneElement, ReactElement } from 'react'
import { twMerge, join } from 'tailwind-merge'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'
import { closeModal$, modalContentComponent$, openModal$ } from '../../streams/ui'

type Props = {
  
}

class Overlay extends Component<Props> {
  destroy$ = new Subject()
  
  componentDidMount() {
    const $html = document.querySelector('html') as HTMLElement

    merge(
      merge(
        openModal$,
      ).pipe(
        tap(() => {
          $html.style.top = `-${window.scrollY}px`;
          $html.style.position = 'fixed'
          $html.style.width = '100%'
        })
      ),
      merge(
        closeModal$,
      ).pipe(
        tap(() => {
          const scrollY = $html.style.top.replace('px', '')
          $html.style.position = ''
          $html.style.top = ''
          $html.style.width = ''
          window.scrollTo({
            top: parseInt(scrollY || '0') * -1,
            left: 0,
            behavior: "instant" as ScrollBehavior,
          })
        })
      ),
      modalContentComponent$,
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

    return (
      <div
        className={join(
          modalContentComponent$.value.length === 0 && "hidden",
        )}
      >
        <div
          className={join(
            "fixed top-0 left-0 w-[100%] h-[100%]",
            "backdrop-blur",
            "cursor-pointer",
          )}
          onClick={() => closeModal$.next(true)} 
        />
        {modalContentComponent$.value.map((component, idx) => {
          const isLastLayer = idx === modalContentComponent$.value.length - 1
          return cloneElement(component as ReactElement, {
            dimmed: !isLastLayer, 
            zIndex: 10000 + idx,
          })
        })}
      </div>
    )
  }
}

export default Overlay

export type IOverlay = InstanceType<typeof Overlay>