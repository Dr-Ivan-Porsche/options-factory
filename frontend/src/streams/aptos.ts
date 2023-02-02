import { AptosClient, Types } from 'aptos'
import { BehaviorSubject, forkJoin, from, of } from 'rxjs'
import { catchError, map, switchMap, tap } from 'rxjs/operators'
import { CONTRACT_ADDRESS } from '../constants/address'
import { getStrikePriceOnList, MATURITY_LIST, STRIKE_PRICE_LIST } from '../constants/items'
import { TransactionPayload } from '../types/Transaction'
import { monthToString } from '../utils/misc'
import { fetch$ } from './api'

export const client = new AptosClient('https://fullnode.devnet.aptoslabs.com/v1')
// export const client = new AptosClient('https://fullnode.mainnet.aptoslabs.com/v1')

export const aptosPrice$ = new BehaviorSubject(0)
export const DEFAULT_APTOS_PRICE = 18

export const sendTransaction$ = (transaction: TransactionPayload) => {
  return from(window.aptos.signAndSubmitTransaction(transaction)).pipe(
    catchError((err) => {
      console.log(err, '@err')
      return of(false)
    }),
    switchMap((pendingTransaction: any) => {

      if (!pendingTransaction) return of(false)

      return from(client.waitForTransaction(pendingTransaction.hash)).pipe(
        map(() => pendingTransaction)
      )
    })
  )
}

type ResourceArg = {
  address: string
  resource: string
}

export const getResource$ = ({ address, resource }: ResourceArg) => {
  return fetch$({
    url: `https://fullnode.devnet.aptoslabs.com/v1/accounts/${address}/resource/${resource}`
  }).pipe(
    map(({ data }) => data)
  )
}

type GetTableArg = {
  table_handle: any,
  key: any
  value_type: any,
}

export const getTableItem$ = ({ table_handle, key, value_type }: GetTableArg) => {
  return fetch$({
    url: `https://fullnode.devnet.aptoslabs.com/v1/tables/${table_handle}/item`,
    options: {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        key_type: "u64",
        value_type,
        key,
      })
    }
  }).pipe(
    catchError(() => {
      return of(0)
    })
  )
}

export const getModuleData$ = () => {
  return getResource$({
    address: CONTRACT_ADDRESS,
    resource: `${CONTRACT_ADDRESS}::controller::ModuleData`
  }).pipe(
    switchMap((item: any) => {
      const {
        total_call_volume,
        total_put_volume,
        last_price,
      } = item

      return of({
        total_call_volume,
        total_put_volume,
        last_price,
      })
    })
  )
}

export const getVolumeData$ = (aptosPrice: number) => {

  const maturityKeys = MATURITY_LIST.map((i) => `${i.getTime()}`)
  const strikePriceKeys = getStrikePriceOnList(aptosPrice || DEFAULT_APTOS_PRICE).map((val) => {
    return String(val * 100)
  })

  return forkJoin([
    from(
      client.client.view.view({
        function: `${CONTRACT_ADDRESS}::controller::get_volume_data_by_maturity`,
        type_arguments: [],
        arguments: [maturityKeys],
      })
    ),
    from(
      client.client.view.view({
        function: `${CONTRACT_ADDRESS}::controller::get_volume_data_by_strike_price`,
        type_arguments: [],
        arguments: [strikePriceKeys],
      })
    )
  ]).pipe(
    map(([_byMaturity, _byStrikePrice]) => {

      const byMaturity = _byMaturity[0]
      const byStrikePrice = _byStrikePrice[0]

      return {
        maturity: maturityKeys.reduce((acc: any, maturityTimestamp, idx) => {
          const [call, put] = (byMaturity as any)[idx]
          const _date = new Date(Number(maturityTimestamp))

          acc.push({
            timestamp: maturityTimestamp,
            title: `${_date.getDate()}${monthToString(_date.getMonth() + 1)?.toUpperCase()}${String(_date.getFullYear()).slice(-2)}`,
            call: Number(call),
            put: Number(put),
          })
          return acc
        }, []),

        strikePrice: strikePriceKeys
        .reduce((acc: any, strikePrice, idx) => {
          const [call, put] = (byStrikePrice as any)[idx]

          acc.push({
            strikePrice: strikePrice,
            title: `$${Number(strikePrice) / 100}`,
            call: Number(call),
            put: Number(put),
          })
          return acc
        }, [])
        // .filter(({ call, put }: { call: number, put: number }) => {
        //   return call !== 0 || put !== 0
        // })
      }
    })
  )
}

type GetPayoutArg = {
  receiver: string,
  name: string,
  amount: number | string
}
export const getPayout$ = ({ receiver, name, amount }: GetPayoutArg) => {
  console.log({ receiver, name, amount }, `{ receiver, name, amount }`)
  return from(
    client.client.view.view({
      function: `${CONTRACT_ADDRESS}::controller::get_payout`,
      type_arguments: [],
      arguments: [
        receiver,
        String(name),
        String(amount)
      ],
    })
  ).pipe(
    tap(console.log)
  )
}