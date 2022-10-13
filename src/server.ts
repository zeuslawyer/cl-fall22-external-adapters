import process from "process";
import express, { Express, Request, Response } from "express";
import bodyParser from "body-parser";
import axios from "axios";

type EAInput = {
  id: number | string;
  data: {
    number: number | string;
    infoType: string;
  };
};

type EAOutput = {
  jobRunId: string | number;
  statusCode: number;
  data: {
    result?: any;
  };
  error?: string;
};

const PORT = process.env.PORT || 8080;
const app: Express = express();

app.use(bodyParser.json());

app.get("/", function (req: Request, res: Response) {
  res.send("Hello World!");
});

app.post("/", async function (req: Request<{}, {}, EAInput>, res: Response) {
  const eaInputData: EAInput = req.body;
  console.log(" Request data received: ", eaInputData);

  // Build API Request
  const url = `http://numbersapi.com/${eaInputData.data.number}/${eaInputData.data.infoType}`;

  let eaResponse: EAOutput = {
    data: {},
    jobRunId: eaInputData.id,
    statusCode: 0,
  };

  try {
    const apiResponse = await axios.get(url);

    // It's common practice to store the desired result value in a top-level result field.
    eaResponse.data = { result: apiResponse.data };
    eaResponse.statusCode = apiResponse.status;

    res.json(eaResponse);
  } catch (error: any) {
    console.error("API Response Error: ", error);
    eaResponse.error = error.message;
    eaResponse.statusCode = error.response.status;

    res.json(eaResponse);
  }

  console.log("returned response:  ", eaResponse);
  return;
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

process.on("SIGINT", () => {
  console.info("\nShutting down server...");
  process.exit(0);
});
