const AWS = require('aws-sdk');
const https = require('https');
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS,
  secretAccessKey: process.env.AWS_SECRET
});

module.exports.getAptosPrice = async (event) => {

  let result

  try {
    const bucketName = "aptos-options-issuance";
    const objectKey = "aptos-price.json";
    const apiUrl = "https://api.coingecko.com/api/v3/simple/price?ids=APTOS&vs_currencies=usd"

    // Check if the data is already cached in the S3 bucket
    const s3Data = await s3.getObject({ Bucket: bucketName, Key: objectKey }).promise();
    const s3DataTimestamp = s3Data.Metadata.timestamp;
    const currentTimestamp = Date.now();

    // If the data is less than 1 minute old, return it from the cache
    if (currentTimestamp - s3DataTimestamp < 1000 * 60) {
      console.log("Returning data from S3 cache");

      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(
          {
            data: JSON.parse(s3Data.Body.toString())
          },
        ),
      }
    }

    // Otherwise, fetch the data from the API and store it in the cache
    console.log("Fetching data from API");
    const apiData = await getDataFromApi(apiUrl);
    await s3.putObject({
      Bucket: bucketName,
      Key: objectKey,
      Body: JSON.stringify(apiData),
      Metadata: {
        timestamp: currentTimestamp.toString()
      }
    }).promise();

    result = apiData
  } catch (err) {
    console.log(err);
    result = 0
  }

  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(
      {
        data: result
      },
    ),
  }
};

async function getDataFromApi(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve(JSON.parse(data));
      });
    }).on("error", (err) => {
      reject(err);
    });
  });
}