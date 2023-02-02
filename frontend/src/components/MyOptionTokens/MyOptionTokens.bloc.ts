import { BehaviorSubject, Subject, forkJoin } from 'rxjs'
import { takeUntil, tap, switchMap, map } from 'rxjs/operators'

import type IMyOptionTokens from './MyOptionTokens'

export default class {
  comp: IMyOptionTokens
  page$: BehaviorSubject<number>
  isLoading$: BehaviorSubject<boolean>
  
  constructor(comp: IMyOptionTokens) {
    this.comp = comp
    this.page$ = new BehaviorSubject(1)
    this.isLoading$ = new BehaviorSubject(false)
  } 
} 
