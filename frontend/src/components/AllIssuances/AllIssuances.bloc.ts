import { BehaviorSubject, Subject, forkJoin } from 'rxjs'
import { takeUntil, tap, switchMap, map } from 'rxjs/operators'

import type IAllIssuances from './AllIssuances'

export default class {
  comp: IAllIssuances
  page$: BehaviorSubject<number>
  isLoading$: BehaviorSubject<boolean>
  
  constructor(comp: IAllIssuances) {
    this.comp = comp
    this.page$ = new BehaviorSubject(1)
    this.isLoading$ = new BehaviorSubject(false)
  } 
} 
