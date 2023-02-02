import React, { Component, Fragment, createRef } from 'react'
import { twMerge, join } from 'tailwind-merge'
import { Subject, merge, of, timer } from 'rxjs'
import { takeUntil, tap, debounceTime } from 'rxjs/operators'

import Bloc from './CancelModal.bloc'
import Modal from './Modal'
import LabelRow from '../LabelRow'
import ModalButtons from './ModalButtons'
import Button from '../Button/Button'
import { closeModal$, pushBanner$ } from '../../../streams/ui'
import { getOpponentTokenName, monthToString } from '../../../utils/misc'
import { sendTransaction$ } from '../../../streams/aptos'
import { CONTRACT_ADDRESS } from '../../../constants/address' 
import MyOptionTokenItem from '../../MyOptionTokens/MyOptionTokenItem'
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

  direction_type: any
  maturity: any
  option_type: any
  strike_price: any
}

// For Option Closing
class CancelModal extends Component<Props> {
  bloc = new Bloc(this)

  destroy$ = new Subject()

  componentDidMount() {
    merge(
      this.bloc.opponentToken$,
      this.bloc.isLoading$,
      this.bloc.isCancelling$,
    ).pipe(
      debounceTime(1),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.forceUpdate()
    })

    const { name } = this.props
    
    this.bloc.getOpponentToken(name)
  }

  componentWillUnmount() {
    this.destroy$.next(true)
  }

  renderContent = () => {

    const {
      name,
      amount,
      expiry,
      strikePrice,
      isCall,
      isLong,
      last_price_at_maturity,

      direction_type,
      maturity,
      option_type,
      strike_price,
    } = this.props

    const opponentToken = this.bloc.opponentToken$.value

    const availableAmountToCancel = Math.min(
      amount || 0,
      this.bloc.opponentToken$.value?.amount || 0,
    )

    const isCancelNotAvailable = this.bloc.opponentToken$.value && !this.bloc.opponentToken$.value.amount

    if (this.bloc.isLoading$.value) {
      return (
        <div className="flex h-[100%] items-center justify-center">
          <Loading />
        </div>
      )
    }

    if (availableAmountToCancel == 0) {
      return (
        <p>You can't close this token.</p>
      )
    }

    return (
      <>
        <p 
          className="text-[23px] font-bold mb-[48px] text-gray"
        >
          Are you sure to close the following positions?
        </p>
        <MyOptionTokenItem
          last_price_at_maturity={last_price_at_maturity}
          name={name}
          amount={availableAmountToCancel}
          noRenderRight
          direction_type={direction_type}
          maturity={maturity}
          option_type={option_type}
          strike_price={strike_price}
        />
        {
          opponentToken?.name && (
            <MyOptionTokenItem
              last_price_at_maturity={last_price_at_maturity}
              name={opponentToken?.name}
              amount={availableAmountToCancel}
              noRenderRight
              direction_type={opponentToken.direction_type}
              maturity={maturity}
              option_type={option_type}
              strike_price={strike_price}
            />
          )
        }
        <ModalButtons
          className="mt-[52px]"
          onCancel={() => {
            closeModal$.next(true)
          }}
          right={(
            <Button
              className="w-[350px] h-[64px] bg-darkred text-[#ffffff]"
              title={`Close ${availableAmountToCancel} ${isCall ? "Call" : "Put"} Positions`}
              isLoading={this.bloc.isCancelling$.value}
              onClick={() => {
                this.bloc.isCancelling$.next(true)

                sendTransaction$({
                  type: "entry_function_payload",
                  function: `${CONTRACT_ADDRESS}::controller::close_options`,
                  arguments: [
                    name,
                    opponentToken.name,
                    availableAmountToCancel,
                  ],
                  type_arguments: []
                }).subscribe((res) => {

                  this.bloc.isCancelling$.next(false)

                  if (!res) {
                    return
                  }

                  pushBanner$.next({
                    type: "success",
                    content: "Option cancel successful."
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
      </>
    )
  }

  render() {
    return (
      <Modal>
        {this.renderContent()}
      </Modal>
    )
  }
}

export default CancelModal

export type ICancelModal = InstanceType<typeof CancelModal>