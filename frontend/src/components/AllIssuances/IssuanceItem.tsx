import React, { Component, Fragment, createRef } from 'react'
import { twMerge, join } from 'tailwind-merge'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'
import { timestampToString } from '../../utils/misc'

type Props = {
  direction: string,
  size: string,
  maturity: string,
  strikePrice: string,
  isLong: boolean,
  isCall: boolean,
  premium: string,
  totalPremium: string,
  iv: string,
  price: string,
  timestamp: number,
}

const IssuanceItemSpan = ({ value, className }: { 
  value: any,
  className?: string
}) => {
  return (
    <span
      className={twMerge(
        join(
          "font-ethica font-normal text-[13px] text-gray",
        ),
        className,
      )}
    >
      {value}
    </span>
  )
}

class IssuanceItem extends Component<Props> {
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
    const {
      direction,
      size,
      maturity,
      strikePrice,
      isLong,
      isCall,
      premium,
      totalPremium,
      iv,
      price,
      timestamp,
    } = this.props

    return (
      <Fragment>
        <IssuanceItemSpan
          className={join(
            isLong ? "text-green" : "text-red",
            "pl-[20px]",
          )}
          value={isLong ? "Long" : "Short"}
        />
        <IssuanceItemSpan value={size} />
        <IssuanceItemSpan value={maturity} />
        <IssuanceItemSpan value={strikePrice} />
        <IssuanceItemSpan
          className={isCall ? "text-green" : "text-red"}
          value={isCall ? "Call" : "Put"} 
        />
        {/* <IssuanceItemSpan value={premium} />
        <IssuanceItemSpan value={totalPremium} /> */}
        <IssuanceItemSpan value={`${(Number(iv) * 100).toFixed(2)}%`} />
        <IssuanceItemSpan value={`$${price}`} />
        <IssuanceItemSpan value={timestampToString(timestamp)} />
      </Fragment>
    )
  }
}

export default IssuanceItem

export type IIssuanceItem = InstanceType<typeof IssuanceItem>