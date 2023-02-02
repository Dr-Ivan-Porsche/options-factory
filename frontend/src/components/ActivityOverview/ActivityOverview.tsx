import React, { Component, Fragment, createRef } from 'react'
import { twMerge, join } from 'tailwind-merge'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime, switchMap } from 'rxjs/operators'
import HeadingLabel from '../common/HeadingLabel'
import OpenInterest from './OpenInterest'
import { fetchVolumeData$, volumeData$ } from '../../streams/options'
import { aptosPrice$, getVolumeData$ } from '../../streams/aptos'

type Props = {
  
}

class ActivityOverview extends Component<Props> {
  destroy$ = new Subject()
  
  componentDidMount() {
    merge(
      volumeData$,
    ).pipe(
      debounceTime(1),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })

    merge(
      fetchVolumeData$,
      aptosPrice$,
    ).pipe(
      switchMap(() => {
        return getVolumeData$(aptosPrice$.value)
      }),
      takeUntil(this.destroy$)
    ).subscribe((volumeData) => {
      console.log(volumeData, '@volumeData')
      volumeData$.next(volumeData)
    })
  }
  
  componentWillUnmount() {
    this.destroy$.next(true)
  }
    
  render() {
    return (
      <div className={join(
          "flex flex-col",
       )}
      >
        <HeadingLabel
          title="Activity Overview"
        />
        <div className="bg-black2 h-[1026px] rounded-[8px]">
          <OpenInterest 
            data={volumeData$.value && volumeData$.value.maturity || []}
            title="Open Interest by Maturity"
            className="mb-[40px]"
          />
          <OpenInterest
            data={volumeData$.value && volumeData$.value.strikePrice || []}
            title="Open Interest by Strike" 
          />
        </div>
      </div>
    )
  }
}

export default ActivityOverview

export type IActivityOverview = InstanceType<typeof ActivityOverview>