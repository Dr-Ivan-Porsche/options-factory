import { BehaviorSubject, Subject, forkJoin } from 'rxjs'
import { takeUntil, tap, switchMap, map } from 'rxjs/operators'

import type IIssueConfirmModal from './IssueConfirmModal'

export default class {
  comp: IIssueConfirmModal
  isLoading$: BehaviorSubject<boolean>
  
  constructor(comp: IIssueConfirmModal) {
    this.comp = comp
    
    this.isLoading$ = new BehaviorSubject(false)
  } 
} 
