import { from, of } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';

const APTOS_PRICE_URL = "https://opa5xiqk77.execute-api.ap-northeast-2.amazonaws.com/default/aptos-options-issuance-dev-getAptosPrice"

export const fetch$ = ({ url, options }: { url: string, options?: any }) => {
  return from(
    fetch(url, (options || {}))
      .then((response) => {
        if (!response) throw new Error(`no response`);

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        return response.json()
      })
  ).pipe(
    retry(10),
    catchError(error => {
      console.log(error)
      return of(0)
    })
  )
}

export const fetchAptosPrice$ = () => fetch$({ url: APTOS_PRICE_URL }).pipe(
  map((data: any) => data?.data?.aptos?.usd)
)


export const faucet$ = ({ address }: { address: string }) => {
  const AMOUNT = String(10000000000) // 10 APT
  return fetch$({
    url: `https://faucet.devnet.aptoslabs.com/mint?address=${address}&amount=${AMOUNT}`,
    options: {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        address,
        amount: AMOUNT,
      })
    }
  }) 
}

window.faucet$ = faucet$