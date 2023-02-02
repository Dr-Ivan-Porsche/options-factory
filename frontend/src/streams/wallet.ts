import { BehaviorSubject, from, of, timer } from "rxjs";
import { catchError, delay, map, switchMap, tap } from "rxjs/operators"
import { faucet$ } from "./api";
import { client } from './aptos';
import { pushBanner$ } from "./ui";

export const walletAddress$ = new BehaviorSubject('')
export const accountInfo$ = new BehaviorSubject({})
export const myOptions$ = new BehaviorSubject([])

export const signin$ = () => {
  if (!window.aptos) {
    alert("Please Install Petra Wallet")
    window.open('https://chrome.google.com/webstore/detail/petra-aptos-wallet/ejjladinnckdgjemekebdpeokbikhfci')
    return of(false)
  }

  return from(window.aptos.connect()).pipe(
    catchError((err) => {
      return of(err)
    }),
    switchMap((result) => {
      const address = result?.address
      if (!result || !address) return of(false)

      return from(window.aptos.network()).pipe(
        switchMap((network) => {

          if (network !== "Devnet") {
            alert("Please change network to Devnet.")
            return of(false)
          }

          return from(client.getAccount(address)).pipe(
            catchError((err) => {
              return faucet$({ address }).pipe(
                delay(1000),
                switchMap(() => {
                  return from(client.getAccount(address))
                })
              )
            }),
            tap((accountInfo) => {
              walletAddress$.next(address)
              accountInfo$.next(accountInfo)

              pushBanner$.next({
                type: "success",
                content: "Wallet connected.",
              })
            })
          )
        })
      )
    })
  )
}

export const signout$ = () => from(window.aptos.disconnect()).pipe(
  catchError((err) => {
    return of(err)
  }),
  tap(() => {
    walletAddress$.next('')
    accountInfo$.next({})
  })
)