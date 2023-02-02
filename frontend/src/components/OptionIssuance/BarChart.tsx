import React, { Component, Fragment, createRef } from 'react'
import { twMerge, join } from 'tailwind-merge'
import { Subject, merge, of, BehaviorSubject } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import Bloc from './BarChart.bloc'
import YAxis from './YAxis'
import XAxis from './XAxis'

type Props = {
  data: any
}

class BarChart extends Component<Props> {
  bloc = new Bloc(this)

  destroy$ = new Subject()
  
  componentDidMount() {
    merge(
      
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
    const { data } = this.props
    const _maxValue = data.reduce((acc: any, cur: any) => {
      acc = Math.max(acc, cur.call, cur.put)
      return acc
    }, 0)
    const maxValue = Math.max(10, _maxValue)
    const offset = maxValue / 5

    return (
      <div className={join(
          "flex",
          "flex-col",
          "relative",
          "h-[300px]",
       )}
      >
        <YAxis
          offset={offset}
          maxValue={maxValue} 
        />
        <XAxis
          items={data}
          maxValue={maxValue}
        />
      </div>
    )
  }
}

export default BarChart

export type IBarChart = InstanceType<typeof BarChart>