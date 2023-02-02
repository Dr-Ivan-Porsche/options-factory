import { BehaviorSubject, Subject, forkJoin } from 'rxjs'
import { takeUntil, tap, switchMap, map } from 'rxjs/operators'

import type IOpenInterest from './OpenInterest'

export default class {
  comp: IOpenInterest
  
  constructor(comp: IOpenInterest) {
    this.comp = comp
    
  } 
} 
