import React, { Component, Fragment, createRef } from 'react'
import { twMerge, join } from 'tailwind-merge'
import { Subject, merge, of, timer } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import Bloc from './ExecuteModal.bloc'
import Modal from './Modal'
import LabelRow from '../LabelRow'
import ModalButtons from './ModalButtons'
import Button from '../Button/Button'
import { closeModal$, pushBanner$ } from '../../../streams/ui'
import { getOptionStatus, monthToString } from '../../../utils/misc'
import { aptosPrice$, getPayout$, sendTransaction$ } from '../../../streams/aptos'
import { CONTRACT_ADDRESS } from '../../../constants/address'
import { blackScholesCall, blackScholesPut, impliedVolCall, impliedVolPut } from '../../../utils/calculate'
import BigNumber from 'bignumber.js'
import { RISK_FREE_RATIO, SIGMA } from '../../../constants/items'
import { walletAddress$ } from '../../../streams/wallet'
import Loading from '../Loading'
import { fetchAllIssuances$, fetchMyOptionTokens$, fetchOverallData$, fetchVolumeData$ } from '../../../streams/options'

type Props = {
  expiry: Date
  strikePrice: string
  isCall?: boolean
  isLong?: boolean
  name: string
  amount: number
  last_price_at_maturity: number
}

class ExecuteModal extends Component<Props> {
  bloc = new Bloc(this)

  destroy$ = new Subject()

  componentDidMount() {
    merge(
      this.bloc.isLoading$,
      this.bloc.isCalculating$,
      this.bloc.payout$,
      aptosPrice$,
    ).pipe(
      debounceTime(1),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })

    const { name, amount, isCall, isLong } = this.props

    this.bloc.isCalculating$.next(true)

    getPayout$({
      receiver: walletAddress$.value,
      name,
      amount,
    }).subscribe((payout) => {
      const payoutAmount = isCall 
        ? isLong 
          ? new BigNumber(payout).div(10 ** 8).toNumber() // APT 
          : new BigNumber(payout).div(10 ** 6).toNumber()
        : new BigNumber(payout).div(10 ** 6).toNumber() // USDC
      this.bloc.payout$.next(payoutAmount)

      this.bloc.isCalculating$.next(false)
    })
  }

  componentWillUnmount() {
    this.destroy$.next(true)
  }

  render() {
    const {
      name,
      amount,
      expiry,
      strikePrice,
      isCall,
      isLong,
      last_price_at_maturity,
    } = this.props

    const date = expiry.getUTCDate()
    const month = monthToString(expiry.getUTCMonth() + 1)?.toUpperCase()
    const year = String(expiry.getUTCFullYear()).slice(-2)
    const hours = String(expiry.getUTCHours()).padStart(2, "0")

    const optionTitle = `APT_${date}${month}${year}_${Number(strikePrice).toFixed(2)}_${isCall ? "CALL" : "PUT"}_`

    const leftTimeUntilExpiry = new Date(expiry).getTime() - new Date().getTime()

    const isMatured = leftTimeUntilExpiry < 0

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

    const status = getOptionStatus({
      isCall: !!isCall,
      strikePrice: Number(strikePrice),
      lastPriceAtMaturity: last_price_at_maturity,
    })

    const youGetAmount = this.bloc.payout$.value || 0
    const youGetAmountInDollar = isCall 
      ? isLong 
        ? new BigNumber(aptosPrice$.value).multipliedBy(youGetAmount).toFixed(2)
        : youGetAmount.toFixed(2)
      : youGetAmount.toFixed(2)

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
            {optionTitle}{isLong 
              ? <span className="text-green">LONG</span>
              : <span className="text-red">SHORT</span>
            }
          </p>
        </div>
        <div className="flex items-center justify-between w-[100%] gap-[24px]">
          <LabelRow title="STATUS" value={status} />
          <LabelRow title="STRIKE PRICE" value={`$${Number(strikePrice)}`} />
        </div>
        <div className="flex items-center justify-between w-[100%] gap-[24px]">
          <LabelRow title="PRICE AT MATURITY" value={`$${last_price_at_maturity}`} />
          <LabelRow title="AMOUNT" value={amount} />
        </div>
        <div
          className={join(
            "flex items-center justify-center",
            "mt-[24px]",
          )}
        >
          {this.bloc.isCalculating$.value 
            ? <div className="flex h-[24px] items-center justify-center">
                <Loading />
              </div>
            : (
              <>
                <span
                  className={join(
                    "text-bold text-[16px] leading-[24px] text-gray",
                    "mr-[16px]",
                  )}
                >
                  YOU'RE GETTING
                </span>
                <img
                  className="w-[20px] h-[20px] mr-[8px]"
                  src={isCall
                    ? isLong
                      ? "/assets/images/aptos.svg" 
                      : "/assets/images/usdc.svg"
                    : "/assets/images/usdc.svg"
                  }
                />
                <span
                  className={join(
                    "text-[16px] text-gray text-semibold leading-[24px] mr-[4px]",
                  )}
                >
                  {youGetAmount}
                </span>
                <span
                  className={join(
                    "font-normal text-gray text-[16px] leading-[24px]",
                  )}
                >
                  (${youGetAmountInDollar})
                </span>
              </>
            )
          }
        </div>
        <ModalButtons
          className="mt-[52px]"
          onCancel={() => {
            closeModal$.next(true)
          }}
          right={(
            <Button
              disabled={!isMatured}
              className="w-[350px] h-[64px] bg-skyblue text-[#0f1414]"
              isLoading={this.bloc.isLoading$.value}
              title={`Execute Option ${youGetAmount == 0 ? "Disposal" : "Settlement"}`}
              onClick={() => {
                this.bloc.isLoading$.next(true)
                sendTransaction$({
                  type: "entry_function_payload",
                  function: `${CONTRACT_ADDRESS}::controller::settle_options`,
                  arguments: [
                    name,
                    amount,
                  ],
                  type_arguments: []
                }).subscribe((res) => {

                  this.bloc.isLoading$.next(false)
                  
                  if (!res) {
                    return
                  }

                  pushBanner$.next({
                    type: "success",
                    content: "Option execution successful."
                  })

                  timer(1000).subscribe(() => {
                    fetchMyOptionTokens$.next(true)
                    fetchAllIssuances$.next(true)
                    fetchOverallData$.next(true)
                    fetchVolumeData$.next(true)
                  })

                  closeModal$.next(true)
                })
              }}
            />
          )}
        />
      </Modal>
    )
  }
}

export default ExecuteModal

export type IExecuteModal = InstanceType<typeof ExecuteModal>