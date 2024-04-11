import type { BigNumberish, BytesLike, AddressLike } from "ethers";

export type DeployContractStruct = {
  amount: BigNumberish;
  salt: BytesLike;
  bytecode: BytesLike;
  expected: AddressLike;
  tag: string;
  afterCalldatas: BytesLike[];
};

export interface DeploymentRequest {
  projectName: string; // Required
  contracts: ContractDeploymentRequest[]; // Required
}

export interface ContractDeploymentRequest {
  order: number; // Required
  contractName: string; // Required
  salt?: string; // Optional
  deploymentBytecode?: string; // Optional
  transactionHash?: string; // Optional
  functionCalls?: string[]; // Optional
}

export interface DeploymentResponse {
  message: string;
  contracts?: ContractDeploymentResponse[];
}

export interface ContractDeploymentResponse {
  order: number; // Required
  contractName: string; // Required
  address: string; // Required
}

export interface GetAddressRequest {
  deploymentBytecode: string;
  salt?: string;
}

const txHashRegex = /^0x[a-fA-F0-9]{64}$/;
const bytes32HexRegex = /^0x[a-fA-F0-9]{64}$/;
const hexRegex = /^0x[a-fA-F0-9]+$/;
export const validateDeploymentRequest = (data: any): DeploymentRequest => {
  if (!data || typeof data !== "object") throw new Error("Invalid request");
  // validate projectName
  if (typeof data.projectName !== "string")
    throw new Error("Invalid request body format. projectName is required");
  // validate contracts
  if (!data.contracts || !Array.isArray(data.contracts))
    throw new Error(
      "Invalid request body format. contracts is required and must be an array",
    );

  data.contracts.every((item: ContractDeploymentRequest) => {
    // validate order
    if (typeof item.order !== "number")
      throw new Error(
        "Invalid request body format. order is required and must be a number",
      );
    // validate contractName
    if (typeof item.contractName !== "string")
      throw new Error(
        "Invalid request body format. contractName is required and must be a string",
      );
    // validate salt to be 32 bytes hex string
    if (item.salt) {
      if (typeof item.salt !== "string")
        throw new Error("Invalid request body format. salt must be a string");
      try {
        bytes32HexRegex.test(item.salt);
      } catch (error) {
        throw new Error(
          "Invalid request body format. salt must be a 32 bytes hex string",
        );
      }
    }
    // validate deploymenttBytecode to be hex string
    if (item.deploymentBytecode) {
      if (typeof item.deploymentBytecode !== "string")
        throw new Error(
          "Invalid request body format. deploymenttBytecode must be a string",
        );
      try {
        hexRegex.test(item.deploymentBytecode);
      } catch (error) {
        throw new Error(
          "Invalid request body format. deploymenttBytecode must be a hex string",
        );
      }
    }
    // validate transactionHash to be 32 bytes hex string
    if (item.transactionHash) {
      if (typeof item.transactionHash !== "string")
        throw new Error(
          "Invalid request body format. transactionHash must be a string",
        );
      try {
        txHashRegex.test(item.transactionHash);
      } catch (error) {
        throw new Error(
          "Invalid request body format. transactionHash must be a 32 bytes hex string",
        );
      }
    }
    // validate functionCalls to be an array of hex strings
    if (item.functionCalls) {
      if (!Array.isArray(item.functionCalls))
        throw new Error(
          "Invalid request body format. functionCalls must be an array",
        );
      if (!item.functionCalls.every((call: string) => hexRegex.test(call)))
        throw new Error(
          "Invalid request body format. functionCalls must be an array of hex strings",
        );
    }

    if (!item.deploymentBytecode && !item.transactionHash) {
      throw new Error(
        "Invalid request body format. Either deploymentBytecode or transactionHash is required",
      );
    }
  });

  return data as DeploymentRequest;
};

export const validateGetAddressRequest = (data: any): GetAddressRequest => {
  if (!data || typeof data !== "object") throw new Error("Invalid request");
  // validate deploymenttBytecode to be hex string
  if (typeof data.deploymentBytecode !== "string")
    throw new Error(
      "Invalid request body format. deploymenttBytecode must be a string",
    );
  if (!hexRegex.test(data.deploymentBytecode)) {
    throw new Error(
      "Invalid request body format. deploymenttBytecode must be a hex string",
    );
  }
  // validate salt to be 32 bytes hex string
  if (data.salt) {
    if (typeof data.salt !== "string")
      throw new Error("Invalid request body format. salt must be a string");
    if (!bytes32HexRegex.test(data.salt)) {
      throw new Error(
        "Invalid request body format. salt must be a 32 bytes hex string",
      );
    }
  }

  return data as GetAddressRequest;
};
