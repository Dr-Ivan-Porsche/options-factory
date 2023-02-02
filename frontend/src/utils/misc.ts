export const isSameAddress = (a: any, b: any) => {
  return String(a).toLowerCase() === String(b).toLowerCase()
}

export const nFormatter = (number: any, n: number) => {
  const [integerPart, decimalPart] = String(number).split('.')

  if (decimalPart) {
    return Number(integerPart).toLocaleString('en-us') + "." + decimalPart.slice(0, n)
  }

  return number
}

export const timestampToString = (timestamp: number) => {
  const _date = new Date(timestamp)
  const date = _date.getUTCDate()
  const month = monthToString(_date.getUTCMonth() + 1)
  const year = _date.getUTCFullYear()
  const hours = String(_date.getUTCHours()).padStart(2, "0")
  const minutes = String(_date.getUTCMinutes()).padStart(2, "0")

  return `${date} ${month} ${year} ${hours}:${minutes} UTC+0`
}


export const monthToString = (month: number) => {
  switch (month) {
    case 1:
      return "Jan"
    case 2:
      return "Feb"
    case 3:
      return "Mar"
    case 4:
      return "Apr"
    case 5:
      return "May"
    case 6:
      return "Jun"
    case 7:
      return "Jul"
    case 8:
      return "Aug"
    case 9:
      return "Sep"
    case 10:
      return "Oct"
    case 11:
      return "Nov"
    case 12:
      return "Dec"
  }
}

type OptionTitleArg = {
  underlyingAsset: string,
  expiry: Date,
  strikePrice: string,
  isCall?: boolean,
  isLong?: boolean,
}

export const getOptionTitle = ({
  underlyingAsset = "APT",
  expiry,
  strikePrice,
  isCall,
  isLong,
}: OptionTitleArg) => {

  if (!expiry) return ''

  const date = expiry.getDate()
  const month = monthToString(expiry.getMonth() + 1)
  const year = String(expiry.getFullYear()).slice(-2)

  return `${underlyingAsset}-${date}${month}${year}-${strikePrice}-${isCall ? "CALL" : "PUT"}-${isLong ? "Long" : "Short"}`
}

export const getOptionPropertyFromName = (name: string) => {

  const [
    _underlyingAsset,
    _maturity,
    _strikePrice,
    _callPut,
    _direction,
  ] = String(name).split('_')

  const isLong = _direction === "LONG"
  const isCall = _callPut === "CALL"
  const expiry = new Date(Number(_maturity))
  const strikePrice = String(Number(_strikePrice) / 100)

  return {
    isLong,
    isCall,
    strikePrice,
    expiry,
  }
}

export const hexToUtf8 = (hexString: string) => {

  if (!hexString.startsWith("0x")) return hexString

  var hex = (hexString || "").toString();
  var str = '';
  for (var i = 0; i < hex.length; i += 2) {
    var code = parseInt(hex.substr(i, 2), 16);
    str += String.fromCharCode(code);
  }
  return decodeURIComponent(escape(str));
}

// itm | atm | otm
type GetOptionStatusArg = {
  isCall: boolean,
  strikePrice: number,
  lastPriceAtMaturity: number,
}

export const getOptionStatus = ({ 
  isCall,
  strikePrice,
  lastPriceAtMaturity,
}: GetOptionStatusArg) => {
  if (isCall) {
    // Call
    if (strikePrice == lastPriceAtMaturity) return 'ATM'
    if (strikePrice > lastPriceAtMaturity) return 'OTM'
    return 'ITM'
  } else {
    // Put
    if (strikePrice == lastPriceAtMaturity) return 'ATM'
    if (strikePrice > lastPriceAtMaturity) return 'ITM'
    return 'OTM'
  }
}

export const getOpponentTokenName = (name: string) => {
  const splitted = name.split('_')
  const opponentTokenName = splitted.slice(0, splitted.length - 1).join('_')
    + "_" + (splitted[splitted.length - 1] === "LONG" ? "SHORT" : "LONG")

  return opponentTokenName
}