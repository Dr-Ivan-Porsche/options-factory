import React, { Component, Fragment, createRef } from 'react'
import { twMerge, join } from 'tailwind-merge'
import { Subject, merge, of } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import Bloc from './OptionIssuance.bloc'
import RadioList from '../common/RadioList'
import Button from '../common/Button/Button'
import Input from '../common/Input/Input'
import ExpiryInput from '../common/Input/ExpiryInput'
import HeadingLabel from '../common/HeadingLabel'
import { openModal$ } from '../../streams/ui'
import IssueConfirmModal from '../common/Modal/IssueConfirmModal'
import Checkbox from '../common/Checkbox'
import Dropdown from '../common/Dropdown/Dropdown'
import { range } from 'lodash'
import { aptosPrice$ } from '../../streams/aptos'

type Props = {
  
}

class OptionIssuance extends Component<Props> {
  bloc = new Bloc(this)

  destroy$ = new Subject()
  
  componentDidMount() {
    merge(
      this.bloc.advanced$,

      this.bloc.optionType$, // call | put

      this.bloc.collateralAsset$,
      this.bloc.collatrealAssetAmount$,
      this.bloc.strikePriceSelection$,

      this.bloc.expiryDay$,
      this.bloc.expiryMonth$,
      this.bloc.expiryYear$,
      this.bloc.expiryHours$,
      this.bloc.expiryMinutes$,
      this.bloc.expirySeconds$,

      this.bloc.expiryTime$,

      this.bloc.lastPriceMaturity$,
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

    const expiryTime = this.bloc.advanced$.value
      // new Date("2023-02-01 08:00 UTC+0"),
      ? `${this.bloc.expiryYear$.value}-${this.bloc.expiryMonth$.value.padStart(2, "0")}-${this.bloc.expiryDay$.value.padStart(2, "0")} ${this.bloc.expiryHours$.value.padStart(2, "0")}:${this.bloc.expiryMinutes$.value.padStart(2, "0")}:${this.bloc.expirySeconds$.value.padStart(2, "0")} UTC+0`
      : this.bloc.expiryTime$.value.key

    const issueDisabled = this.bloc.advanced$.value 
      ? (
        !this.bloc.collatrealAssetAmount$.value ||
        !this.bloc.strikePrice$.value ||
        !this.bloc.expiryYear$.value ||
        !this.bloc.expiryMonth$.value ||
        !this.bloc.expiryDay$.value ||
        !this.bloc.expiryHours$.value ||
        !this.bloc.expiryMinutes$.value ||
        !this.bloc.expirySeconds$.value ||
        !this.bloc.lastPriceMaturity$.value ||

        // invalid year
        !(2023 <= Number(this.bloc.expiryYear$.value) && Number(this.bloc.expiryYear$.value) < 2100) ||
        // invalid month
        !(1 <= Number(this.bloc.expiryMonth$.value) && Number(this.bloc.expiryMonth$.value) <= 12) ||
        // invalid date
        !(1 <= Number(this.bloc.expiryDay$.value) && Number(this.bloc.expiryDay$.value) <= 31) ||
        // invalid timestamp
        new Date(expiryTime).getTime() < new Date().getTime()
      )
      : (
        !this.bloc.collatrealAssetAmount$.value ||
        !this.bloc.strikePriceSelection$.value.key ||
        !this.bloc.expiryTime$.value || 
        !this.bloc.lastPriceMaturity$.value
      )

    return (
      <>
        <HeadingLabel 
          title="Option Issuance"
          right={(
            <Checkbox
              title="Advanced"
              checked$={this.bloc.advanced$}
            />
          )}
        />
        <div 
          className={join(
            "flex flex-col",
            "p-[24px]",
            "bg-black2",
            "mb-[16px]",
            "rounded-[8px]",
          )}
        >
          <RadioList
            className="mb-[36px]"
            selectedKey={this.bloc.optionType$.value}
            list={[
              {
                key: "call",
                label: "Call option",
                value: "Call option",
                onClick: () => {
                  this.bloc.optionType$.next('call')
                }
              },
              {
                key: "put",
                label: "Put option",
                value: "Put option",
                onClick: () => {
                  this.bloc.optionType$.next('put')
                }
              }
            ]}
          />
          <div
            className={join(
              "flex justify-between",
              "mb-[36px]",
              "gap-[20px]"
            )}
          >
            {/* Collateral Asset */}
            <Input
              rootClassName="flex-1"
              className="h-[64px]"
              onBlur={() => {
                if (this.bloc.collatrealAssetAmount$.value) {
                  this.bloc.collatrealAssetAmount$.next(
                    String(parseInt(this.bloc.collatrealAssetAmount$.value))
                  )
                }
              }}
              value$={this.bloc.collatrealAssetAmount$}
              inputClassName={join(
                "text-[22px] font-semibold text-gray",
                this.bloc.optionType$.value === 'call'
                  ? 'pr-[90px]'
                  : 'pr-[110px]'
              )}
              label="COLLATERAL ASSET"
              placeholder="0"
              right={(
                <span 
                  className={join(
                    "absolute top-[50%] right-[20px] translate-y-[-50%]",
                    "flex items-center",
                    "select-none",
                    "h-[24px] px-[18px]",
                    "text-[14px] font-bold text-gray/50",
                    "rounded-[14px] bg-black3/50"
                  )}
                >
                  {this.bloc.optionType$.value === 'call'
                    ? "APT"
                    : "USDC"
                  }
                </span>
              )}
            />
            {/* Strike Price */}
            {this.bloc.advanced$.value 
              ? (
                <Input
                  value$={this.bloc.strikePrice$}
                  rootClassName="flex-1"
                  className="h-[64px]"
                  inputClassName="text-[22px] font-semibold text-gray"
                  label="STRIKE PRICE"
                  placeholder="0"
                />
              )
              : (
                <Dropdown
                  label="STRIKE PRICE"
                  items={this.bloc.STRIKE_PRICE_RANGE}
                  selected={this.bloc.strikePriceSelection$.value}
                />
              )
            }
          </div>
          <div
            className={join(
              "flex",
              "mb-[36px]",
              "items-end",
              "gap-[20px]"
            )}
          >
            {this.bloc.advanced$.value 
              ? (
                <div
                  className={join(
                    "flex",
                    "w-[100%] items-end",
                    "gap-[20px]",
                  )}
                >
                  {/* Maturity Input 1 */}
                  <ExpiryInput
                    className="flex-1"
                    label="MATURITY"
                    day$={this.bloc.expiryDay$}
                    month$={this.bloc.expiryMonth$}
                    year$={this.bloc.expiryYear$}
                  />
                  {/* Maturity Input 2 */}
                  <ExpiryInput
                    className="flex-1 relative"
                    label=""
                    hours$={this.bloc.expiryHours$}
                    minutes$={this.bloc.expiryMinutes$}
                    seconds$={this.bloc.expirySeconds$}
                    right={(
                      <span
                        className={join(
                          "absolute top-[50%] right-[20px] translate-y-[-50%]",
                          "flex items-center",
                          "select-none",
                          "h-[24px] px-[8px]",
                          "text-[14px] font-bold text-gray/50",
                          "rounded-[14px] bg-black3/50"
                        )}
                      >
                        UTC+0
                      </span>
                    )}
                  />
                </div>
              )
              : (
                <div
                  className={join(
                    "flex",
                    "w-[100%] items-end",
                  )}
                >
                  <Dropdown
                    label="MATURITY"
                    items={this.bloc.EXPIRY_LIST}
                    selected={this.bloc.expiryTime$.value}
                  />
                  <span
                    className={join(
                      "flex flex-1",
                      "text-[18px] font-normal text-gray/50",
                      "items-center",
                      "h-[64px]",
                      "pl-[22px]",
                    )}
                  >
                    08:00 UTC+0
                  </span>
                </div>
              )
            }
          </div>
          {/* Buttons */}
          <div className="flex gap-[20px]">
            <Button
              rootClassName="flex-1"
              className={join(
                "bg-skyblue",
                "text-black4",
                issueDisabled && [
                  "opacity-50",
                  "cursor-not-allowed"
                ]
              )}
              title="Review Issuance"
              onClick={() => {

                if (issueDisabled) return

                openModal$.next({
                  component: (
                    <IssueConfirmModal
                      isCall={this.bloc.optionType$.value === 'call'}
                      expiry={new Date(expiryTime)}
                      strikePrice={this.bloc.advanced$.value 
                        ? this.bloc.strikePrice$.value
                        : String(this.bloc.strikePriceSelection$.value.key)
                      }
                      collateralAmount={this.bloc.collatrealAssetAmount$.value}
                      lastPriceMaturity={this.bloc.lastPriceMaturity$.value}
                    />
                  )
                })
              }}
            />
          </div>
        </div>
        <div
          className="flex items-center gap-[50px] mb-[33px]"
        >
          <span
            className={join(
              "text-[15px] text-gray font-bold",
            )}
          >
            APT Price at Maturity (Only for DEMO)
          </span>
          <Input
            value$={this.bloc.lastPriceMaturity$}
            rootClassName="flex-1 relative"
            className="h-[48px] pl-[40px]"
            inputClassName="text-[16px] font-semibold text-gray"
            placeholder="0"
            left={(
              <span
                className={join(
                  "absolute",
                  "top-[50%] translate-y-[-50%] left-[20px]"
                )}
              >
                $
              </span>
            )}
          />
        </div>
      </>
    )
  }
}

export default OptionIssuance

export type IOptionIssuance = InstanceType<typeof OptionIssuance>