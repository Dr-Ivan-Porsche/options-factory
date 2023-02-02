const math = require('mathjs');

type BlackScholesArg = {
  S: number, // APT Price
  K: number, // Strike Price
  r: number, // annualized risk-free interest rate (CONSTANT)
  sigma: number, // volatility of stock (CONSTANT)
  t: number, // expiry time in years
}

type ImpliedVolArg = {
  price: number, // call option price | put option price
  S: number, // APT Price
  K: number, // Strike Price
  r: number, // annualized risk-free interest rate (CONSTANT)
  t: number, // expiry time in years
}

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