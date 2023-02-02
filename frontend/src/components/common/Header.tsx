import React, { Component, Fragment, createRef } from 'react'
import { twMerge, join } from 'tailwind-merge'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'
import { LabelColumn } from './LabelColumn'
import ConnectWallet from './ConnectWallet'
import { aptosPrice$ } from '../../streams/aptos'
import { nFormatter } from '../../utils/misc'
import { moduleData$ } from '../../streams/options'
import BigNumber from 'bignumber.js'

type Props = {
  
}

class Header extends Component<Props> {
  destroy$ = new Subject()
  
  componentDidMount() {
    merge(
      aptosPrice$,
      moduleData$,
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

    const putCallRatio = Number(
        new BigNumber(moduleData$.value?.total_put_volume)
        .div(Number(moduleData$.value?.total_call_volume) || 1)
        .toFixed(2)
    )

    return (
      <div 
        className={join(
          "relative",
          "flex",
          "justify-center",
          "w-[100%] h-[176px]",
          "py-[48px]",
          "bg-[#090d0d]",
          "mb-[72px]"
       )}
      >
        <div className="flex justify-between items-center w-[100%] px-[72px] max-w-[1440px]">
          <img className="w-[177px] h-[61px]" src="/assets/images/logo.svg" />
          <div className="flex items-center gap-x-[16px]">
            <LabelColumn
              labelImageSrc="/assets/images/aptos-mark-wht.svg"
              labelClassName="mb-[8px]"
              label="APT Price"
              value={`$${nFormatter(aptosPrice$.value, 2)}`}
            />
            <LabelColumn
              labelClassName="mb-[8px]"
              label="Call Volume"
              value={moduleData$.value?.total_call_volume}
            />
            <LabelColumn
              labelClassName="mb-[8px]"
              label="Put Volume"
              value={moduleData$.value?.total_put_volume}
            />
            <LabelColumn
              labelClassName="mb-[8px]"
              label="Put/Call Ratio"
              value={putCallRatio}
            />
            {/* <LabelColumn
              labelClassName="mb-[8px]"
              label="24h Volume"
              value="28.24K"
            /> */}
          </div>
          <ConnectWallet />
        </div>
      </div>
    )
  }
}

export default Header

export type IHeader = InstanceType<typeof Header>