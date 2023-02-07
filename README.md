# Options Factory

<p align="center"><img width="100%" alt="Screenshot 2023-02-07 at 3 57 52 PM" src="https://user-images.githubusercontent.com/38854208/217198569-6a5bb725-247e-4cb3-99ce-c3520f4b9592.png"></p>

|Name|Link|
|------|------------------|
|Website (devnet)|[https://options-factory.net](https://options-factory.net)|
|Contract (devnet)|[0x2eb74655638e224b68b554bdc86efb22ad3f54fdc87602c2dd7bc6afac95fb03](https://explorer.aptoslabs.com/account/0x2eb74655638e224b68b554bdc86efb22ad3f54fdc87602c2dd7bc6afac95fb03?network=devnet)|

## Introduction
Option Factory will further support the function to create Structure Product by wrapping FT and NFT.

## Background
The DeFi models, introduced in 2018, have shown their potential to substitute a large part of TradFi in the 2021 Bull Market. Therefore, the advanced DeFi models emerging during the current Bear Market will play a significant role again in the next Bull Market.  

The key to the advanced DeFi would be derivatives, and our team’s primary interest is a Structured Product integrated with Derivatives. Structure Product will fulfill various needs of financial institutions.

## Product Summary
With all these infrastructures in place, institutional investors from the traditional financial market will be able to design and trade various Structured Products on Aptos.

* We propose an Option Issuance infrastructure (Option Factory) that allows issuing Long/Short positions for European Call/Put Options. This is the elementary step to Structured Product. Option Factory also provides the following functions, Options Settlement, and Position Close.

* The difference from existing Option Protocols is that Short Position can be issued with a transferable NFT-based token as well as the Long Position Option, which can be traded developing a Short Position as a token creates a traditional Structure Product that sells Volatility. It also has the advantage of being compatible with NFT marketplaces because Option Positions are issued as NFT-based.

## Mechanism

### Option Issuance
‘Option Issuer’ issues ‘Long Option’ token & ‘Short Option’ tokens at once. 
Payoff must be deposited to issue the options.

### Option Trade
By selling one side of an option token, the issuer can take a position in one direction. 
The seller of the option token receives the option premium from the buyer.

### Option Closing
The option issuer can close their option position by offsetting an equal amount of long and short option tokens.
Additionally, holders of option tokens who have taken a position in one direction can close their position by buying the opposite position's option tokens and offsetting the same quantity of tokens.

### Option Termination
If an option is Out-of-The-Money (OTM) and reaches expiration, the long option is terminated. 
In this case, the short option holder can exercise the short option and claim the collateral from the Option Factory.

### Option Settlement
In the case of expiration with an In-The-Money (ITM), the Long option holder can exercise their option. 
In this case, the Long option holder pays an asset equal to the strike price and claim the collateral deposited by the option issuer from the Option Factory.

## Architecture

<p align="center"><img width="100%" alt="Screenshot 2023-02-07 at 4 23 36 PM" src="https://user-images.githubusercontent.com/38854208/217204306-349f4ac8-6a17-494f-b009-36c1d24c4109.png"></p>

## Mathematics
The Black-Scholes formula for 
calculating option price.

```
S 		= current APT price (spot price)
K 		= exercise price (strike price)
T 		= expiry time in years
r 		= annualized risk-free interest rate
sigma 		= volatility of Deribit ETH Options
```

Call option price calculation formula:
```
PV_S = S*exp(-q*T) = S*1 = S;
PV_K = K*exp(-r*T);

d1 = (log(S/K) + T*(r + sigma^2/2))/(sigma*sqrt(T));
d2 = d1 - sigma*sqrt(T);

N(d) = int(exp(-(t^2)/2),t,-Inf,d)*1/sqrt(2*pi)

Call Option Price = N(d1)*S - N(d2)*PV_K
```

Put option price calculation formula:
```
PV_S = S*exp(-q*T) = S*1 = S;
PV_K = K*exp(-r*T);

d1 = (log(S/K) + T*(r + sigma^2/2))/(sigma*sqrt(T));
d2 = d1 - sigma*sqrt(T);

N(d) = int(exp(-(t^2)/2),t,-Inf,d)*1/sqrt(2*pi)

Put Option Price = N(-d2)*PV_K - N(d1)*S
```

Implied volatility:
```
export const blackScholesCall = ({ S, K, r, sigma, t }: BlackScholesArg) => {
  var d1 = (math.log(S / K) + (r + math.pow(sigma, 2) / 2) * t) / (sigma * math.sqrt(t));
  var d2 = d1 - sigma * math.sqrt(t);
  const result = S * gaussianCDF(d1) - K * math.exp(-r * t) * gaussianCDF(d2)
  return isNaN(result) ? 0 : result;
}

export const blackScholesPut = ({ S, K, r, sigma, t }: BlackScholesArg) => {
  var d1 = (math.log(S / K) + (r + math.pow(sigma, 2) / 2) * t) / (sigma * math.sqrt(t));
  var d2 = d1 - sigma * math.sqrt(t);
  const result = K * math.exp(-r * t) * gaussianCDF(-d2) - S * gaussianCDF(-d1)
  return isNaN(result) ? 0 : result;
}

function gaussianCDF(x: number) {
  return (1.0 + erf(x / Math.sqrt(2.0))) / 2.0;
}

function erf(x: number) {
  var a1 = 0.254829592;
  var a2 = -0.284496736;
  var a3 = 1.421413741;
  var a4 = -1.453152027;
  var a5 = 1.061405429;
  var p = 0.3275911;
  var t = 1.0 / (1.0 + p * Math.abs(x));
  var y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return (x >= 0) ? y : -y;
}

export const impliedVolCall = ({ price, S, K, r, t }: ImpliedVolArg) => {
  var sigma = 0.1;
  var priceNew = blackScholesCall({ S, K, r, sigma, t });
  var diff = price - priceNew;
  while (math.abs(diff) > 0.0001) {
    sigma += diff / 100;
    priceNew = blackScholesCall({ S, K, r, sigma, t });
    diff = price - priceNew;
  }
  return sigma;
}

export const impliedVolPut = ({ price, S, K, r, t }: ImpliedVolArg) => {
  var sigma = 0.1;
  var priceNew = blackScholesPut({ S, K, r, sigma, t });
  var diff = price - priceNew;
  while (math.abs(diff) > 0.0001) {
    sigma += diff / 100;
    priceNew = blackScholesPut({ S, K, r, sigma, t });
    diff = price - priceNew;
  }
  return sigma;
}
```

