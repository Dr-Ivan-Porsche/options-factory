import React, { Component, Fragment, createRef } from 'react'
import { twMerge, join } from 'tailwind-merge'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime, switchMap } from 'rxjs/operators'

import Bloc from './OpenInterest.bloc'
import BarChart from '../OptionIssuance/BarChart'
import { getVolumeData$ } from '../../streams/aptos'
import { fetchVolumeData$, volumeData$ } from '../../streams/options'

type Props = {
  title: string,
  data: any,
  className?: string,
}

class OpenInterest extends Component<Props> {
  bloc = new Bloc(this)

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
    const { title, data, className } = this.props
    return (
      <div 
        className={twMerge(
          join(
            "flex flex-col",
            "justify-center",
            "pt-[40px] px-[24px]",
            "h-[440px]",
          ),
          className,
        )}
      >
        <p 
          className={join(
            "flex justify-center",
            "font-bold text-[18px] text-gray",
            "mb-[40px]",
          )}
        >
          {title}
        </p>
        <BarChart data={data} />
      </div>
    )
  }
}

export default OpenInterest

export type IOpenInterest = InstanceType<typeof OpenInterest>