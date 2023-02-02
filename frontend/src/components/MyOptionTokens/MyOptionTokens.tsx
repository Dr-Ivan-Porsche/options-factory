import React, { Component, Fragment, createRef } from 'react'
import { twMerge, join } from 'tailwind-merge'
import { Subject, merge, of, interval } from 'rxjs'
import { takeUntil, tap, debounceTime, switchMap } from 'rxjs/operators'
import Heading from '../common/Heading'
import HeadingLabel from '../common/HeadingLabel'
import Pagination from '../common/Pagination'

import Bloc from './MyOptionTokens.bloc'
import MyOptionTokenItem from './MyOptionTokenItem'
import { openModal$ } from '../../streams/ui'
import ExecuteModal from '../common/Modal/ExecuteModal'
import { myOptions$, walletAddress$ } from '../../streams/wallet'
import { getMyOptions$ } from '../../streams/indexer'
import { getOptionPropertyFromName } from '../../utils/misc'
import { fetchMyOptionTokens$ } from '../../streams/options'
import Loading from '../common/Loading'

type Props = {
  
}

class MyOptionTokens extends Component<Props> {
  bloc = new Bloc(this)

  destroy$ = new Subject()
  
  componentDidMount() {
    merge(
      this.bloc.page$,
      this.bloc.isLoading$,
      myOptions$,
    ).pipe(
      debounceTime(1),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })

    // interval(1000 * 5).pipe(
    //   takeUntil(this.destroy$)
    // ).subscribe(() => {
    //   fetchMyOptionTokens$.next(true)
    // })

    merge(
      fetchMyOptionTokens$,
      walletAddress$,
      this.bloc.page$,
    ).pipe(
      switchMap(() => {

        const address = walletAddress$.value
        if (!address) {
          return of([])
        }

        this.bloc.isLoading$.next(true)

        return getMyOptions$({ account: address, page: this.bloc.page$.value })
      }),
      takeUntil(this.destroy$)
    ).subscribe((options) => {
      myOptions$.next(options)
      this.bloc.isLoading$.next(false)
    })
  }
  
  componentWillUnmount() {
    this.destroy$.next(true)
  }

  renderContent = () => {

    if (this.bloc.isLoading$.value) {
      return (
        <div className="flex h-[100%] items-center justify-center">
          <Loading />
        </div>
      )
    }

    if (myOptions$.value.length == 0) {
      return (
        <div
          className={join(
            "flex h-[100%]",
            "items-center justify-center",
          )}
        >
          You don't have any option token.
        </div>
      )
    }
    
    return myOptions$.value.map(({ 
      collection_name, 
      name, 
      direction_type, 
      maturity, 
      option_type, 
      strike_price, 
      amount,
      last_price_at_maturity,
    }) => {
 
      return (
        <MyOptionTokenItem
          name={name}
          direction_type={direction_type}
          maturity={maturity}
          option_type={option_type}
          strike_price={strike_price}
          amount={amount}
          last_price_at_maturity={last_price_at_maturity}
        />
      )
    })
  }
    
  render() {
    
    return (
      <div className={join(
          "flex flex-col",
       )}
      >
        <HeadingLabel 
          title="My Option Tokens"
          right={(
            <Pagination
              canNext={myOptions$.value.length === 5}
              page$={this.bloc.page$}
              itemPerPage={5}
            />
          )}
        />
        {/* Content */}
        <div 
          className={
            join(
              "flex flex-col",
              "h-[333px]",
              "p-[24px]",
              "bg-black2",
              "rounded-[8px]",
            )
          }
        >
          {this.renderContent()}
        </div>
      </div>
    )
  }
}

export default MyOptionTokens

export type IMyOptionTokens = InstanceType<typeof MyOptionTokens>