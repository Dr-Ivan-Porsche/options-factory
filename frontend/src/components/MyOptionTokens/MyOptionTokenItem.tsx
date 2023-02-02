import React, { Component, Fragment, createRef } from 'react'
import { twMerge, join } from 'tailwind-merge'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'
import { getOptionPropertyFromName, monthToString } from '../../utils/misc'
import { openModal$ } from '../../streams/ui'
import ExecuteModal from '../common/Modal/ExecuteModal'
import CancelModal from '../common/Modal/CancelModal'

type Props = {
  name: string,
  amount: number,
  onClick?: () => void
  noRenderRight?: boolean,
  last_price_at_maturity: number,

  direction_type: any
  maturity: any
  option_type: any
  strike_price: any
}

class MyOptionTokenItem extends Component<Props> {
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

  renderRight = () => {
    const { 
      name, 
      amount, 
      last_price_at_maturity,
      direction_type,
      maturity,
      option_type,
      strike_price,
    } = this.props
    
    const isLong = direction_type === "LONG"
    const isCall = option_type === "CALL"
    const expiry = new Date(Number(maturity))
    const isMatured = new Date().getTime() > expiry.getTime()

    const strikePrice = String(Number(strike_price) / 100)

    if (isMatured) {
      return (
        <div
          className={join(
            "flex",
            "items-center",
            "w-[96px] h-[24px]",
            "pl-[4px]",
            "text-[14px] font-bold text-gray",
            "bg-jade",
            "rounded-[14px]",
            "cursor-pointer"
          )}
          onClick={() => {
            openModal$.next({
              component: (
                <ExecuteModal
                  name={name}
                  amount={amount}
                  expiry={expiry}
                  strikePrice={strikePrice}
                  isCall={isCall}
                  isLong={isLong}
                  last_price_at_maturity={last_price_at_maturity}
                />
              )
            })
          }}
        >
          <img 
            className={join(
              "w-[20px] h-[20px]",
              "mr-[2px]",
            )}
            src="/assets/images/exclamation.svg" 
          />
          Maturity
        </div>
      )
    }

    return (
      <div
        className={join(
          "flex items-center",
        )}
      >
        <div
          onClick={() => {
            openModal$.next({
              component: (
                <ExecuteModal
                  name={name}
                  amount={amount}
                  expiry={expiry}
                  strikePrice={strikePrice}
                  isCall={isCall}
                  isLong={isLong}
                  last_price_at_maturity={last_price_at_maturity}
                />
              )
            })
          }}
          className={join(
            "flex",
            "items-center justify-center text-center",
            "h-[24px]",
            "px-[16px]",
            "text-[14px] font-bold text-gray",
            "bg-[#1C2424]",
            "rounded-[14px]",
            "mr-[6px]",
            "cursor-pointer",
          )}
        >
          Details
        </div>
        <div
          onClick={() => {
            openModal$.next({
              component: (
                <CancelModal
                  name={name}
                  amount={amount}
                  expiry={expiry}
                  strikePrice={strikePrice}
                  isCall={isCall}
                  isLong={isLong}
                  last_price_at_maturity={last_price_at_maturity}

                  direction_type={direction_type}
                  maturity={maturity}
                  option_type={option_type}
                  strike_price={strike_price}
                />
              )
            })
          }}
          className={join(
            "flex",
            "items-center justify-center text-center",
            "h-[24px]",
            "px-[16px]",
            "text-[14px] font-bold text-gray",
            "bg-[#984D4B]",
            "rounded-[14px]",
            "cursor-pointer",
          )}
        >
          Close
        </div>
      </div>
    )
  }
    
  render() {
    const { 
      name, 
      amount, 
      noRenderRight, 
      onClick,
      direction_type,
      maturity,
      option_type,
      strike_price,
    } = this.props

    const isLong = direction_type === "LONG"
    const isCall = option_type === "CALL"
    const expiry = new Date(Number(maturity))

    const optionTitle = name

    return (
      <div className="flex items-center mb-[8px]">
        <span 
          className={join(
            "flex items-center justify-center",
            "w-[50px] h-[50px]",
            "rounded-[5px]",
            "bg-primary",
            "mr-[8px]",
            "font-semibold text-[14px] leading-[24px]",
            isLong 
              ? "text-green"
              : "text-red"
          )}
        >
          {amount}
        </span>
        <div 
          onClick={onClick}
          className={join(
            "flex flex-auto",
            "justify-between items-center",
            "w-[100%] h-[50px]",
            "px-[16px]",
            "bg-primary",
            "rounded-[5px]",
        )}
        >
          <span 
            className={join(
              "text-[14px] font-bold text-gray",
              "leading-[24px]"
            )}
          >
            {optionTitle}
          </span>
          {!noRenderRight && this.renderRight()}
        </div>
      </div>
    )
  }
}

export default MyOptionTokenItem

export type IMyOptionTokenItem = InstanceType<typeof MyOptionTokenItem>