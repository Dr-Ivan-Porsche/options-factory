'use strict';

const { BCS } = require("aptos");
const { AptosClient, TxnBuilderTypes, AptosAccount, HexString } = require("aptos");

const APTOS_ENDPOINT = 'https://fullnode.mainnet.aptoslabs.com/v1'

module.exports.settleOptions = async (event) => {
  const now = new Date();
  let nowUTC = new Date(now.toUTCString());
  
  // Current Timestamp
  const nowTimestamp = nowUTC.getTime() / 1000;

  // Expiry Timestamp
  nowUTC.setUTCHours(8);
  nowUTC.setUTCMinutes(0);
  nowUTC.setUTCSeconds(0);
  const timestamp = nowUTC.getTime() / 1000;

  console.log("current timestamp: ", nowTimestamp);
  console.log("option expiry timestamp: ", timestamp);

  if (nowTimestamp < timestamp) {
    console.log("Not yet time to settle options..");
    return;
  }

  const privateKeyInUint8Array = HexString.ensure(process.env.PRIVATE_KEY).toUint8Array();
  const sender = new AptosAccount(privateKeyInUint8Array);
  const aptosClient = new AptosClient(APTOS_ENDPOINT);

  let result = await aptosClient.generateSignSubmitTransaction(
    sender,
    new TxnBuilderTypes.TransactionPayloadEntryFunction(
      TxnBuilderTypes.EntryFunction.natural(
        "a1eb5b8d88f1d3f9b50d0276ad8486ba878e6bd7cc36ba3d9671197a23b9d5fa::controller",
        "settle_staked_options",
        [],
        [BCS.bcsSerializeUint64(timestamp)]
      )
    )
  )
  console.log("transaction hash: ", result);


  return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};
