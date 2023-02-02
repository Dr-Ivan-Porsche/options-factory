import React, { Component, Fragment, createRef } from 'react'
import { twMerge, join } from 'tailwind-merge'
import { Subject, merge, of, interval, forkJoin, timer, fromEvent } from 'rxjs'
import { takeUntil, tap, debounceTime, switchMap, startWith } from 'rxjs/operators'
import ConnectWallet from '../components/common/ConnectWallet'
import Header from '../components/common/Header'
import OptionIssuance from '../components/OptionIssuance/OptionIssuance'
import MyOptionTokens from '../components/MyOptionTokens/MyOptionTokens'
import AllIssuances from '../components/AllIssuances/AllIssuances'
import ActivityOverview from '../components/ActivityOverview/ActivityOverview'
import { fetchAptosPrice$ } from '../streams/api'
import { aptosPrice$, getModuleData$, getResource$, getTableItem$ } from '../streams/aptos'
import { getAllIssuances$ } from '../streams/indexer'
import { allIssuances$, fetchAllIssuances$, fetchOverallData$, moduleData$ } from '../streams/options'
import { CONTRACT_ADDRESS } from '../constants/address'
import { pushBanner$ } from '../streams/ui'
import { signin$ } from '../streams/wallet'
import Time from '../components/common/Time'

type Props = {
  
}

class Issuance extends Component<Props> {
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

    // aptos price fetcher
    interval(1000 * 10).pipe(
      startWith(0),
      switchMap(() => {
        return forkJoin([
          fetchAptosPrice$()
        ])
      }),
      takeUntil(this.destroy$)
    ).subscribe(([
      aptosPrice,
    ]) => {
      aptosPrice$.next(aptosPrice)
    })

    // module data resource fetcher
    merge(
      interval(1000 * 60).pipe(
        startWith(0),
      ),
      fetchOverallData$,
    ).pipe(
      switchMap(() => {
        return getModuleData$()
      }),
      takeUntil(this.destroy$),
    ).subscribe((moduleData) => {
      moduleData$.next(moduleData)
    })

    // Try to signin
    fromEvent(window, 'load').pipe(
      switchMap(() => {

        window.aptos.onAccountChange(() => {
          signin$().subscribe()
        })

        return signin$()
      }),
      takeUntil(this.destroy$)
    ).subscribe()
  }
  
  componentWillUnmount() {
    this.destroy$.next(true)
  }
    
  render() {
    
    return (
      <div className={join(
          "flex flex-col",
          "w-[100%]",
       )}
      >
        <Header />
        {/* Upper Content */}
        <div 
          className={join(
            "max-w-[1440px] w-[100%] m-auto px-[72px] pb-[200px]",
          )}
        >
          <div className="flex mb-[75px] gap-[24px]">
            <div className="flex-1">
              <ActivityOverview />
            </div>
            <div className="flex flex-col flex-1">
              <OptionIssuance />
              <MyOptionTokens />
            </div>
          </div>
          {/* Bottom Content */}
          <AllIssuances />
        </div>
        <Time />
      </div>
    )
  }
}

export default Issuance

export type IIssuance = InstanceType<typeof Issuance>