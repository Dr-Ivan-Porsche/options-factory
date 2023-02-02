import React, { Component, Fragment, createRef } from 'react'
import { twMerge, join } from 'tailwind-merge'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'
import { signin$, signout$, walletAddress$ } from '../../streams/wallet'

type Props = {
  
}

class ConnectWallet extends Component<Props> {
  destroy$ = new Subject()
  
  componentDidMount() {
    merge(
      walletAddress$,
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
          "flex",
          "items-center justify-center",
          "text-[18px] font-bold text-dove text-center",
          "border-[1px] rounded-[5px]",
          "h-[100%]",
          walletAddress$.value 
            ? "w-[148px]"
            : "w-[128px]",
          "cursor-pointer",
        )}
        onClick={() => {
          if (!walletAddress$.value) {
            signin$().subscribe()
          }
        }}
      >
        {walletAddress$.value 
          ? (
            <div className="flex flex-col">
              {walletAddress$.value.slice(0, 6) + "..." + walletAddress$.value.slice(-4)}
              <button
                onClick={() => {
                  signout$().subscribe()
                }}
                className={join(
                  "w-[100%] h-[24px]",
                  "bg-[#08555c]",
                  "rounded-[14px]",
                  "outline-none",
                  "text-[14px] font-bold text-gray",
                  "mt-[6px]"
                )}
              >
                Disconnect
              </button>
            </div>
          )
          : "Connect Wallet"
        }
      </div>
    )
  }
}

export default ConnectWallet

export type IConnectWallet = InstanceType<typeof ConnectWallet>