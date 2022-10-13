const createRequest = require("./index").createRequest;
const process = require("process");

const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = process.env.EA_PORT || 8080;

app.use(bodyParser.json());

app.post("/", (req, res) => {
  createRequest(req.body, (status, result) => {
    res.status(status).json(result);
  });
});

app.listen(port, () => console.log(`Listening on port ${port}!`));

process.on("SIGINT", () => {
  console.info("Interrupted. Cancelling");
  process.exit(0);
});
