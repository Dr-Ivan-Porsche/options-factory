import { range } from 'lodash'
import { BehaviorSubject, Subject, forkJoin } from 'rxjs'
import { takeUntil, tap, switchMap, map } from 'rxjs/operators'
import { getStrikePriceOnList, MATURITY_LIST, STRIKE_PRICE_LIST } from '../../constants/items'
import { aptosPrice$, DEFAULT_APTOS_PRICE } from '../../streams/aptos'
import { monthToString } from '../../utils/misc'

import type IOptionIssuance from './OptionIssuance'

export default class {
  comp: IOptionIssuance

  // call | put
  optionType$: BehaviorSubject<string>

  advanced$: BehaviorSubject<boolean>

  // APT | USDC
  collateralAsset$: BehaviorSubject<string>
  collatrealAssetAmount$: BehaviorSubject<string>
  strikePriceSelection$: BehaviorSubject<{ title: string, key: number }>
  strikePrice$: BehaviorSubject<string>

  // Custom expiry
  expiryDay$: BehaviorSubject<string>
  expiryMonth$: BehaviorSubject<string>
  expiryYear$: BehaviorSubject<string>
  expiryHours$: BehaviorSubject<string>
  expiryMinutes$: BehaviorSubject<string>
  expirySeconds$: BehaviorSubject<string>

  // Dropdown-based
  expiryTime$: BehaviorSubject<{ title: string, key: number, date: Date }>

  // 
  lastPriceMaturity$: BehaviorSubject<string>
  
  EXPIRY_LIST: any[]
  STRIKE_PRICE_RANGE: any[]
  DEFAULT_SELECTED_STRIKE_PRICE: any

  constructor(comp: IOptionIssuance) {
    this.comp = comp

    this.STRIKE_PRICE_RANGE = STRIKE_PRICE_LIST.map((n) => {
      // const val = 0.5 * n
      const val = n * 0.5
      return {
        key: val,
        title: `$${val.toFixed(1)}`,
        onClick: () => {
          this.strikePriceSelection$.next({
            title: `$${val.toFixed(1)}`,
            key: val,
          })
        }
      }
    })

    this.DEFAULT_SELECTED_STRIKE_PRICE = this.STRIKE_PRICE_RANGE.reduce((acc: any, cur) => {
      const aptosPrice = aptosPrice$.value || DEFAULT_APTOS_PRICE

      if (Math.abs(cur.key - aptosPrice) < acc.diff) {
        return {
          diff: Math.abs(cur.key - aptosPrice),
          key: cur.key,
          title: `$${cur.key.toFixed(1)}`,
          onClick: cur.onClick,
        }
      }

      return acc
    }, { diff: Infinity, title: 0 })

    // expiry list

    this.EXPIRY_LIST = MATURITY_LIST.map((date) => {
      const key = date.getTime()
      const title = `${date.getDate()} ${monthToString(date.getMonth() + 1)} ${date.getFullYear()}`
      return {
        key,
        title,
        date,
        onClick: () => {
          this.expiryTime$.next({
            key,
            title,
            date,
          })
        }
      }
    })

    this.optionType$ = new BehaviorSubject('call')
    this.advanced$ = new BehaviorSubject(false)

    this.collateralAsset$ = new BehaviorSubject('APT')
    this.collatrealAssetAmount$ = new BehaviorSubject('')
    this.strikePriceSelection$ = new BehaviorSubject(this.DEFAULT_SELECTED_STRIKE_PRICE)
    this.strikePrice$ = new BehaviorSubject('')

    this.expiryDay$ = new BehaviorSubject('')
    this.expiryMonth$ = new BehaviorSubject('')
    this.expiryYear$ = new BehaviorSubject('')
    this.expiryHours$ = new BehaviorSubject('')
    this.expiryMinutes$ = new BehaviorSubject('')
    this.expirySeconds$ = new BehaviorSubject('')

    this.expiryTime$ = new BehaviorSubject(this.EXPIRY_LIST[0])

    this.lastPriceMaturity$ = new BehaviorSubject('')
  }

  issue = () => {
    
  }
} 
