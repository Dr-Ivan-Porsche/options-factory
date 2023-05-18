'use strict';

const { AptosPriceServiceConnection } = require("@pythnetwork/pyth-aptos-js");
const { BCS } = require("aptos");
const { AptosClient, TxnBuilderTypes, AptosAccount, HexString } = require("aptos");

const PYTH_ENDPOINT = 'https://xc-mainnet.pyth.network'
const APTOS_ENDPOINT = 'https://fullnode.mainnet.aptoslabs.com/v1'
const PRICE_IDS = [
  "0x03ae4db29ed4ae33d323568895aa00337e658e348b37509f5372ae51f0af00d5"
]

module.exports.feedPrice = async (event) => {

  // Check if the current time is between 08:00 and 08:01 UTC
  const now = new Date();
  const nowTimestamp = now.getTime() / 1000;

  let nowUTC = new Date(now.toUTCString());
  nowUTC.setUTCHours(8);
  nowUTC.setUTCMinutes(0);
  nowUTC.setUTCSeconds(0);
  const timestamp = nowUTC.getTime() / 1000;

  if (Math.abs(nowTimestamp - timestamp) > 30) {
    console.log("current timestamp: ", nowTimestamp);
    console.log("current timestamp (UTC): ", timestamp);
    console.log("shutting down due to large time difference..");
    return;
  } else {
    console.log("setting price at timestamp: ", timestamp);
  }

  const privateKeyInUint8Array = HexString.ensure(process.env.PRIVATE_KEY).toUint8Array();
  const sender = new AptosAccount(privateKeyInUint8Array);
  const pythConnection = new AptosPriceServiceConnection(PYTH_ENDPOINT);
  const aptosClient = new AptosClient(APTOS_ENDPOINT);

  // Get the latest price of APT/USD from pyth by off-chain
  const price = await pythConnection.getLatestPriceFeeds(PRICE_IDS);
  console.log("APT/USD off-chain price: ", price);
  console.log(price[0].p)

  // Get the latest price of APT/USD from on-chain and call set_price function from price_feed
  const priceFeedUpdateData = await pythConnection.getPriceFeedsUpdateData(PRICE_IDS);

  let result = await aptosClient.generateSignSubmitTransaction(
    sender,
    new TxnBuilderTypes.TransactionPayloadEntryFunction(
      TxnBuilderTypes.EntryFunction.natural(
        "515797702e215d28be31d8eefac1e6a82c70da38c114b79016988c3511ee7297::price_feed",
        "set_price",
        [],
        [AptosPriceServiceConnection.serializeUpdateData(priceFeedUpdateData), BCS.bcsSerializeUint64(timestamp) ]
      )
    )
  )
  console.log("transaction hash: ", result);

  return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};
