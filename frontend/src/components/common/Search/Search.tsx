import React, { Component, Fragment, createRef } from 'react'
import { twMerge, join } from 'tailwind-merge'
import { Subject, merge, of, fromEvent } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'
import { BehaviorSubject } from 'rxjs'
import SearchHistory from './SearchHistory'
import Input from '../Input/Input'

type Props = {
  placeholder?: string,
  className?: string,
  value$: BehaviorSubject<string>,
  history$?: BehaviorSubject<any>,
  onHistorySelect?: (item: any) => void,
}

class Search extends Component<Props> {
  $container = createRef<HTMLDivElement>()

  destroy$ = new Subject()
  focused$ = new BehaviorSubject(false)
  isHistoryShow$ = new BehaviorSubject(false)

  componentDidMount() {
    const { value$, history$ } = this.props
    merge(
      this.focused$,
      this.isHistoryShow$,
      value$,
      history$ || of(false)
    ).pipe(
      debounceTime(1),
      tap(() => {
        if (this.focused$.value && !value$.value) {
          this.isHistoryShow$.next(true)
        }

        if (value$.value) {
          this.isHistoryShow$.next(false)
        }
      }),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })

    // If clicked outer area of SearchHistory component, close the component.
    fromEvent(window, 'click').pipe(
      takeUntil(this.destroy$)
    ).subscribe((e) => {
      if (!this.$container.current?.contains(e.target as HTMLElement)) {
        this.isHistoryShow$.next(false)
      }
    })
  }

  componentWillUnmount() {
    this.destroy$.next(true)
  }

  render() {
    const { placeholder, className, value$, history$, onHistorySelect } = this.props

    return (
      <div
        ref={this.$container}
        className={join(
          "relative",
          "w-[85%] dt:w-auto"
        )}
      >
        <Input
          placeholder={placeholder}
          className={className}
          value$={value$}
          hasRemoveButton
        />
        {!!history$ && this.isHistoryShow$.value && history$.value.length !== 0 && (
          <div 
            className={join(
              "absolute top-[52px] left-0 z-10",
              "w-[100%] h-[181px]",
              "bg-black3",
              "shadow-[0_12px_30px_0_rgba(0,0,0,0.5)]"
            )}
          >
            <SearchHistory 
              history$={history$}
              isShow$={this.isHistoryShow$}
              onHistorySelect={onHistorySelect}
            />
          </div>
        )}
      </div>
    )
  }
}

export default Search

export type ISearch = InstanceType<typeof Search>