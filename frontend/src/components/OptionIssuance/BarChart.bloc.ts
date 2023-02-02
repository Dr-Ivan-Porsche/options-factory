import { BehaviorSubject, Subject, forkJoin } from 'rxjs'
import { takeUntil, tap, switchMap, map } from 'rxjs/operators'

import type IBarChart from './BarChart'

export default class {
  comp: IBarChart
  
  constructor(comp: IBarChart) {
    this.comp = comp
    
  } 
} 
