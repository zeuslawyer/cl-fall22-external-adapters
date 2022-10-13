const { Requester, Validator } = require("@chainlink/external-adapter");

require("dotenv").config();

// Define custom error scenarios for the API.
// Return true for the adapter to retry.
const customError = data => {
  if (data.Response === "Error") return true;
  return false;
};

// Define custom parameters to be used by the adapter.
// Extra parameters can be stated in the extra object,
// with a Boolean value indicating whether or not they
// should be required.
const customParams = {
  number: ["number", "integer"], // 'integer' is an alias. The URL parameter can use integer or number, and it will be mapped to 'number'.
  infoType: ["infoType"],
  endpoint: false,
};

/**
 *
 * @param {any} input
 * @param {(status:number, result:any)=>{}} callback
 */
const createRequest = (input, callback) => {
  // The Validator helps you validate the Chainlink request data);
  const validator = new Validator(input, customParams);

  const jobRunID = validator.validated.id;
  const endpoint = validator.validated.data.endpoint || ""; // Note: - no endpoint param in this example. Endpoint means  REST resource.
  const number = validator.validated.data.number;
  const infoType = validator.validated.data.infoType;

  const url = `http://numbersapi.com/${number}/${infoType}`;

  const queryParams = {
    // NOTE: query params are the params inserted in a URL after the ? character.
    // None in this example.
  };

  // This is where you would add method and headers
  // you can add method like GET or POST and add it to the config
  // The default is GET requests
  // method = 'get'
  // headers = 'headers.....'
  const headers = { Authorization: `My-Authn-Here ${process.env.API_KEY}` }; // NOTE: not needed in this example.

  const config = {
    url,
    params: queryParams, // Note: empty object
    headers, // Note: Headers with authorization data etc can be added. This config object is passed to Axios by 'Requester'.
  };

  // The Requester allows API calls be retry in case of timeout
  // or connection failure
  Requester.request(config, customError)
    .then(response => {
      // It's common practice to store the desired value at the top-level
      // result key. This allows different adapters to be compatible with
      // one another.
      response.data = {
        result: response.data,
        date: response.headers.date,
      };

      callback(response.status, Requester.success(jobRunID, response));
    })
    .catch(error => {
      callback(500, Requester.errored(jobRunID, error));
    });
};

// This is a wrapper to allow the function to work with
// GCP Functions
exports.gcpservice = (req, res) => {
  createRequest(req.body, (statusCode, data) => {
    res.status(statusCode).send(data);
  });
};

// This is a wrapper to allow the function to work with
// AWS Lambda
exports.handler = (event, context, callback) => {
  createRequest(event, (statusCode, data) => {
    callback(null, data);
  });
};

// This is a wrapper to allow the function to work with
// newer AWS Lambda implementations
exports.handlerv2 = (event, context, callback) => {
  createRequest(JSON.parse(event.body), (statusCode, data) => {
    callback(null, {
      statusCode: statusCode,
      body: JSON.stringify(data),
      isBase64Encoded: false,
    });
  });
};

// This allows the function to be exported for testing
// or for running in express
module.exports.createRequest = createRequest;
