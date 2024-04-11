import fs from "fs";
import { join } from "path";
import express from "express";
import { ethers, BytesLike } from "ethers";
import dotenv from "dotenv";
import {
  getEnvVariable,
  ZERO_BYTES32,
  splitArray,
  writeToJson,
  formatDate,
} from "./util";
import PermissionedContractFactory from "../artifacts/PermissionedContractFactory.json";
import {
  DeploymentRequest,
  DeploymentResponse,
  ContractDeploymentResponse,
  validateDeploymentRequest,
  DeployContractStruct,
} from "./types";

// Load environment variables
dotenv.config();

// Create express app
const app = express();
app.use(express.json());

// Ensure environment variables are present
const jsonRpcUrl = getEnvVariable("JSON_RPC_URL");
const privateKey = getEnvVariable("PRIVATE_KEY");
const factoryContractAddress = getEnvVariable("FACTORY_CONTRACT_ADDRESS");

// Prepare the wallet and factory contract
const provider = ethers.getDefaultProvider(jsonRpcUrl);
const wallet = new ethers.Wallet(privateKey, provider);
const factory = new ethers.Contract(
  factoryContractAddress,
  PermissionedContractFactory.abi,
  wallet,
);

// Retrieve the transaction data from the blockchain
const retrieveTransactionData = async (txHash: string): Promise<string> => {
  // Fetch the transaction by its hash
  const transaction = await provider.getTransaction(txHash);
  // If the transaction doesn't exist, throw an error
  if (!transaction) {
    throw new Error(`Transaction with hash ${txHash} does not exist.`);
  }
  // Return the 'data' field of the transaction
  return transaction.data;
};

// recursively deploy the contracts
const deployAll = async (
  factory: any,
  rows: any,
  sender: string,
): Promise<void> => {
  try {
    const tx = await factory.bulkCreate(rows, { from: sender });
    const receipt = await tx.wait();
    console.log(`succeed to deploy: ${receipt?.hash}`);
  } catch (err: any) {
    if (
      err.message.includes("too many contracts") ||
      err.message.includes("transaction underpriced")
    ) {
      // Too many contracts
      if (rows.length === 1) {
        throw new Error(
          `failed even single call. address:${rows[0].expected}  err: ${err.message}`,
        );
      }
      const [firstHalf, secondHalf] = splitArray(rows);
      await deployAll(factory, firstHalf, sender);
      await deployAll(factory, secondHalf, sender);
    } else {
      // Other errors
      throw new Error(`failed: ${err.message}`);
    }
  }
};

// Serve HTML files from the current directory
app.use("/", express.static("./static"));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    message: "hello, please submit your codes to '/deploy' endpoint",
  });
});

// Deploy endpoint
app.post("/deploy", async (req, res) => {
  // validate the request body
  let deployReq: DeploymentRequest;
  try {
    deployReq = validateDeploymentRequest(req.body);
  } catch (error: any) {
    return res.status(400).json({
      message: `Invalid request body format. error: ${error.message}`,
    });
  }

  // deploy the contracts
  try {
    const args: DeployContractStruct[] = [];

    // sort the contracts by order
    deployReq.contracts.sort((a, b) => a.order - b.order);

    // prepare bulkCreate arguments
    for (const contract of deployReq.contracts) {
      const salt = contract.salt || ZERO_BYTES32;
      const tag = `${deployReq.projectName}|${contract.contractName}`;
      const afterCalldatas = contract.functionCalls as BytesLike[];
      const bytecode =
        contract.deploymentBytecode ||
        (await retrieveTransactionData(contract.transactionHash!));
      const expected = await factory.getDeploymentAddress(bytecode, salt);

      args.push({
        amount: 0,
        salt,
        bytecode,
        expected,
        tag,
        afterCalldatas,
      });
    }

    // deploy the contracts
    // await deployAll(factory, args, wallet.address);

    // write to json file to feed to Nsuite
    const outputPath = join(
      __dirname,
      "..",
      "static",
      "outputs",
      `${deployReq.projectName}-${formatDate(new Date())}.json`,
    );
    writeToJson(outputPath, args);

    const deployResp: DeploymentResponse = {
      message: "succeed!",
      contracts: deployReq.contracts.map(
        (contract, index) =>
          ({
            order: contract.order,
            contractName: contract.contractName,
            address: args[index].expected,
          }) as ContractDeploymentResponse,
      ),
    };

    res.json(deployResp);
  } catch (error: any) {
    console.error(error);
    // if error message contains `Create2: Failed on deploy`, it means the contract is already deployed
    if (error.message.includes("Create2: Failed on deploy")) {
      return res.status(400).json({
        message: `
        It's highly likely that the one of contract has already been deployed. error: ${error.message}`,
      });
    }
    // other errors
    res.status(400).json({ message: error.message });
  }
});

// List all the output files
app.get("/outputs", (req, res) => {
  const directoryPath = join(__dirname, "..", "static", "outputs");
  fs.readdir(directoryPath, (error, files) => {
    if (error) {
      return res
        .status(500)
        .json({ message: "Failed to list files", error: error.message });
    }

    // Filter out directories if you only want files, not subdirectories
    const fileCheckPromises = files.map((file) =>
      fs.promises.stat(join(directoryPath, file)),
    );
    Promise.all(fileCheckPromises)
      .then((results) => {
        const fileNames = results
          .map((stat, index) => (stat.isFile() ? files[index] : null))
          .filter(Boolean);
        res.json(fileNames);
      })
      .catch((error) =>
        res
          .status(500)
          .json({ message: "Error processing files", error: error.message }),
      );
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
