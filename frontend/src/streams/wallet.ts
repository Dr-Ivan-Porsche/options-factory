import { BehaviorSubject, from, of } from "rxjs";
import { catchError, map, switchMap, tap } from "rxjs/operators"
import { client } from './aptos';
import { pushBanner$ } from "./ui";

export const walletAddress$ = new BehaviorSubject('')
export const accountInfo$ = new BehaviorSubject({})
export const myOptions$ = new BehaviorSubject([])

export const signin$ = () => {
  if (!window.aptos) {
    alert("Please Install Petra Wallet")
    window.open('https://chrome.google.com/webstore/detail/petra-aptos-wallet/ejjladinnckdgjemekebdpeokbikhfci')
  }

  return from(window.aptos.connect()).pipe(
    catchError((err) => {
      return of(err)
    }),
    switchMap((result) => {
      const address = result?.address
      if (!result || !address) return of(false)

      return from(client.getAccount(address)).pipe(
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