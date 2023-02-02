import { range } from "lodash"

export const MATURITY_LIST = [
  new Date("2023-02-03 08:00 UTC+0"),
  new Date("2023-02-10 08:00 UTC+0"),
  new Date("2023-02-17 08:00 UTC+0"),
  new Date("2023-02-24 08:00 UTC+0"),
  new Date("2023-02-28 08:00 UTC+0"),
]

export const STRIKE_PRICE_LIST = range(1, 61)

export const getStrikePriceOnList = (currentAptosPrice: number) => {
  const parsedAptosPrice = Math.floor(currentAptosPrice)
  console.log(parsedAptosPrice, 'parsedAptosPrice')
  return range(-3, 4).map((i) => {
    return parsedAptosPrice + (i * 0.5)
  })
}

export const SIGMA = 0.75
export const RISK_FREE_RATIO = 0.0475