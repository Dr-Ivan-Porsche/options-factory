import React, { Component, Fragment, createRef } from 'react'
import { twMerge, join } from 'tailwind-merge'
import { Subject, merge, of, interval } from 'rxjs'
import { takeUntil, tap, debounceTime, startWith, switchMap } from 'rxjs/operators'

import Bloc from './AllIssuances.bloc'
import HeadingLabel from '../common/HeadingLabel'
import Pagination from '../common/Pagination'
import IssuanceItem from './IssuanceItem'
import { allIssuances$, fetchAllIssuances$ } from '../../streams/options'
import { getOptionTitle, monthToString, timestampToString } from '../../utils/misc'
import { aptosPrice$ } from '../../streams/aptos'
import { blackScholesCall, blackScholesPut, impliedVolCall, impliedVolPut } from '../../utils/calculate'
import { RISK_FREE_RATIO, SIGMA } from '../../constants/items'
import { getAllIssuances$ } from '../../streams/indexer'

type Props = {
  
}

class AllIssuances extends Component<Props> {
  bloc = new Bloc(this)

  destroy$ = new Subject()
  
  componentDidMount() {
    merge(
      this.bloc.page$,
      this.bloc.isLoading$,
      allIssuances$,
      aptosPrice$,
    ).pipe(
      debounceTime(1),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })

    // all issuances fetcher
    merge(
      this.bloc.page$,
      fetchAllIssuances$,
      interval(1000 * 60).pipe(
        startWith(0)
      ),
    ).pipe(
      switchMap(() => {
        return getAllIssuances$({ page: this.bloc.page$.value })
      }),
      takeUntil(this.destroy$)
    ).subscribe((issuances) => {
      allIssuances$.next(issuances)
    })
  }
  
  componentWillUnmount() {
    this.destroy$.next(true)
  }
    
  render() {
    return (
      <div 
        className={join(
          "flex flex-col",
        )}
      >
        <HeadingLabel
          title="All Issuances"
          right={(
            <Pagination
              canNext={allIssuances$.value.length === 100}
              page$={this.bloc.page$}
              itemPerPage={100}
            />
          )}
        />
        {/* Content */}
        <div
          className={
            join(
              "flex flex-col",
              "h-[453px]",
            )
          }
        >
          <div 
            className={join(
              "grid-cols-[109px_64px_226px_91px_96px_81px_92px_210px] h-[52px] gap-[16px] dt:grid",
              "items-center",
              "bg-black2",
              "rounded-t-[8px]",
            )}
          >
            {/* grid header */}
            <span className="pl-[20px] text-[13px] font-bold text-gray">DIRECTION</span>
            <span className="text-[13px] font-bold text-gray">SIZE</span>
            <span className="text-[13px] font-bold text-gray">MATURITY</span>
            <span className="text-[13px] font-bold text-gray">STRIKE $</span>
            <span className="text-[13px] font-bold text-gray">CALL/PUT</span>
            {/* <span className="text-[13px] font-bold text-gray">PREMIUM</span>
            <span className="text-[13px] font-bold text-gray">TOTAL PREMIUM</span> */}
            <span className="text-[13px] font-bold text-gray">IV</span>
            <span className="text-[13px] font-bold text-gray">PRICE $</span>
            <span className="text-[13px] font-bold text-gray">TIMESTAMP</span>
          </div>
          {/* grid contents */}
          <div
            className={join(
              "h-[400px] overflow-scroll",
            )}
          >
            {allIssuances$.value.map((item: any, idx) => {

              const isEven = idx % 2 === 0
              const isLong = item.direction_type === "LONG"
              const isCall = item.option_type === "CALL"
              const expiry = new Date(Number(item.maturity))

              const strikePrice = String(Number(item.strike_price) / 100)

              const expiryString = timestampToString(expiry.getTime())

              const leftTimeUntilExpiry = new Date(expiry).getTime() - new Date().getTime()

              const S = aptosPrice$.value
              const K = Number(strikePrice)
              const r = RISK_FREE_RATIO
              const sigma = SIGMA
              const t = (leftTimeUntilExpiry / 1000) / 86400 / 365

              const price = isCall
                ? blackScholesCall({ S, K, r, sigma, t })
                : blackScholesPut({ S, K, r, sigma, t })

              const iv = isCall
                ? impliedVolCall({ price, S, K, r, t })
                : impliedVolPut({ price, S, K, r, t })

              // @TODO
              const size = item.amount
              const premium = "1"
              const totalPremium = "1"

              return (
                <div
                  className={join(
                    "h-[40px]",
                    "items-center grid-cols-[109px_64px_226px_91px_96px_81px_92px_210px] gap-[16px] dt:grid",
                    isEven ? "bg-primary" : "bg-black2"
                  )}
                >
                  <IssuanceItem
                    direction={isLong ? 'LONG' : 'SHORT'}
                    isLong={isLong}
                    size={size}
                    maturity={expiryString}
                    strikePrice={strikePrice}
                    isCall={isCall}
                    premium={premium}
                    totalPremium={totalPremium}
                    iv={String(iv)}
                    price={String(price.toFixed(2))}
                    timestamp={item.last_transaction_timestamp}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }
}

export default AllIssuances

export type IAllIssuances = InstanceType<typeof AllIssuances>