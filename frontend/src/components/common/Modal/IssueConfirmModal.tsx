import React, { Component, Fragment, createRef } from 'react'
import BigNumber from 'bignumber.js'
import { twMerge, join } from 'tailwind-merge'
import { Subject, merge, of, timer } from 'rxjs'
import { takeUntil, tap, debounceTime, delay } from 'rxjs/operators'

import Bloc from './IssueConfirmModal.bloc'
import Modal from './Modal'
import LabelRow from '../LabelRow'
import ModalButtons from './ModalButtons'
import Button from '../Button/Button'
import { closeModal$, pushBanner$ } from '../../../streams/ui'
import { monthToString, getOptionTitle } from '../../../utils/misc'
import { blackScholesCall, blackScholesPut, impliedVolCall, impliedVolPut } from '../../../utils/calculate'
import { aptosPrice$, sendTransaction$ } from '../../../streams/aptos'
import { CONTRACT_ADDRESS } from '../../../constants/address'
import { fetchAllIssuances$, fetchMyOptionTokens$, fetchOverallData$, fetchVolumeData$ } from '../../../streams/options'
import { RISK_FREE_RATIO, SIGMA } from '../../../constants/items'

type Props = {
  expiry: Date
  strikePrice: string
  collateralAmount: string
  isCall?: boolean
  lastPriceMaturity: string
}

class IssueConfirmModal extends Component<Props> {
  bloc = new Bloc(this)

  destroy$ = new Subject()
  
  componentDidMount() {
    merge(
      aptosPrice$,
      this.bloc.isLoading$,
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
      isCall,
      expiry,
      strikePrice,
      collateralAmount,
      lastPriceMaturity,
    } = this.props

    const date = expiry.getUTCDate()
    const month = monthToString(expiry.getUTCMonth() + 1)
    const year = String(expiry.getUTCFullYear()).slice(-2)

    const optionTitle = `APT-${date}${month}${year}-${strikePrice}-${isCall ? "CALL" : "PUT"}`

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

    const last_price_at_maturity = Number(lastPriceMaturity) * 100

    return (
      <Modal>
        <div
          className={join(
            "flex flex-col",
            "justify-center items-center",
            "w-[100%] h-[106px]",
            "py-[20px]",
            "mb-[24px]",
            "bg-primary",
          )}
        >
          <p
            className={join(
              "font-semibold text-[24px] text-gray",
              "mb-[8px]",
            )}
          >
            {optionTitle}-<span className="text-green">Long</span>
          </p>
          <p
            className={join(
              "font-semibold text-[24px] text-gray",
            )}
          >
            {optionTitle}-<span className="text-red">Short</span>
          </p>
        </div>
        <div className="flex items-center justify-between w-[100%] gap-[24px]">
          <LabelRow title="Price" value={`$${price.toFixed(2)}`} />
          {/* 
            1 collateral amount = 1 size 
            1 APT = 1 size
            1 USDC = 1 size
          */}
          <LabelRow title="AMOUNT" value={collateralAmount} />
        </div>
        <div className="flex items-center justify-between w-[100%] gap-[24px]">
          <LabelRow title="IV" value={`${(iv * 100).toFixed(2)}%`} />
          <LabelRow title="" value="" />
        </div>
        <p
          className={join(
            "flex items-center justify-center",
            "text-[16px] font-bold text-gray leading-[24px]",
            "mt-[24px]",
          )}
        >
          <span className="mr-[16px]">COLLATERAL</span>
          {isCall 
            ? <img className="w-[20px] h-[20px] " src="/assets/images/aptos.svg" />
            : <img className="w-[20px] h-[20px] " src="/assets/images/usdc.svg" />
          }
          <span className="ml-[8px]">{collateralAmount}</span>
          {isCall 
            ? <span className="ml-[4px] text-gray/80 font-normal">(${new BigNumber(collateralAmount).multipliedBy(aptosPrice$.value).toFixed(2)})</span>
            : <span className="ml-[4px] text-gray/80 font-normal">(${new BigNumber(collateralAmount).multipliedBy(1).toFixed(2)})</span>
          }
        </p>
        <ModalButtons
          className="mt-[36px]"
          onCancel={() => {
            closeModal$.next(true)
          }}
          right={(
            <Button
              className={join(
                "w-[350px] h-[64px]",
                "bg-skyblue",
                "text-black4",
              )}
              title={`Issue ${isCall ? "Call" : "Put"} Options`}
              isLoading={this.bloc.isLoading$.value}
              onClick={() => {
                this.bloc.isLoading$.next(true)

                sendTransaction$({
                  type: "entry_function_payload",
                  function: `${CONTRACT_ADDRESS}::controller::issue_options`,
                  arguments: [
                    expiry.getTime(),
                    Number(strikePrice) * 100,
                    isCall,
                    collateralAmount,
                    last_price_at_maturity
                  ],
                  type_arguments: []
                }).pipe(
                  
                ).subscribe((res) => {

                  this.bloc.isLoading$.next(false)

                  if (!res) {
                    return
                  }

                  pushBanner$.next({
                    type: 'success',
                    content: "Open issuance successful",
                  })
                  
                  closeModal$.next(true)

                  timer(1000).subscribe(() => {
                    fetchMyOptionTokens$.next(true)
                    fetchAllIssuances$.next(true)
                    fetchOverallData$.next(true)
                    fetchVolumeData$.next(true)
                  })
                })
              }}
            />
          )}
        />
      </Modal>
    )
  }
}

export default IssueConfirmModal

export type IIssueConfirmModal = InstanceType<typeof IssueConfirmModal>