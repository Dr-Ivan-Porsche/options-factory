import { BehaviorSubject, Subject, forkJoin } from 'rxjs'
import { takeUntil, tap, switchMap, map } from 'rxjs/operators'
import { getOption$ } from '../../../streams/indexer'
import { walletAddress$ } from '../../../streams/wallet'
import { getOpponentTokenName } from '../../../utils/misc'

import type ICancelModal from './CancelModal'

export default class {
  comp: ICancelModal
  opponentToken$: BehaviorSubject<any>
  isLoading$: BehaviorSubject<boolean>
  isCancelling$: BehaviorSubject<boolean>
  
  constructor(comp: ICancelModal) {
    this.comp = comp
    this.opponentToken$ = new BehaviorSubject({})
    this.isLoading$ = new BehaviorSubject(false)
    this.isCancelling$ = new BehaviorSubject(false)
  } 

  getOpponentToken = (name: string) => {
    
    this.isLoading$.next(true)

    getOption$({ 
      name: getOpponentTokenName(name),
      account: walletAddress$.value
    }).subscribe((opponentOption) => {
      this.opponentToken$.next(opponentOption)
      this.isLoading$.next(false)
    })
  }
} 
