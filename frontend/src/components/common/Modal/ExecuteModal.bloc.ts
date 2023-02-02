import { BehaviorSubject, Subject, forkJoin } from 'rxjs'
import { takeUntil, tap, switchMap, map } from 'rxjs/operators'

import type IExecuteModal from './ExecuteModal'

export default class {
  comp: IExecuteModal
  isLoading$: BehaviorSubject<boolean>
  isCalculating$: BehaviorSubject<boolean>
  payout$: BehaviorSubject<number>
  
  constructor(comp: IExecuteModal) {
    this.comp = comp
    this.isLoading$ = new BehaviorSubject(false)
    this.isCalculating$ = new BehaviorSubject(false)
    this.payout$ = new BehaviorSubject(0)
  } 
} 
