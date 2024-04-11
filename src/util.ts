import { writeFile } from "fs";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const ZERO_BYTES32 =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

export function splitArray<T>(array: T[]): [T[], T[]] {
  const middle = Math.ceil(array.length / 2);
  const firstHalf = array.slice(0, middle);
  const secondHalf = array.slice(middle);
  return [firstHalf, secondHalf];
}

export const assertAddresse = (address: string): string => {
  // Checks if the address has the correct length and hex characters
  const re = /^(0x)[0-9a-fA-F]{40}$/;
  if (!re.test(address)) {
    throw new Error(`${address} is not a valid address`);
  }
  return address;
};

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function rand(digits: number): number {
  if (digits <= 0) {
    throw new Error("Digits must be a positive integer");
  }
  return Math.floor(Math.random() * (digits + 1));
}

export const getEnvVariable = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is required`);
  }
  return value;
};

export const writeToJson = (outputPath: string, obj: object): void => {
  const jsonData = JSON.stringify(obj, null);
  // Write the JSON string to a file
  writeFile(outputPath, jsonData, "utf8", (error) => {
    if (error) {
      console.error("An error occurred:", error);
      return;
    }
    console.log(`JSON file has been saved to ${outputPath}`);
  });
};

export const formatDate = (date: Date): string => {
  // Helper function to pad single digits with leading zero
  const pad = (num: number) => num.toString().padStart(2, "0");

  const year = date.getFullYear();
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1); // Months are zero-indexed
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}${day}${month}|${hours}${minutes}`;
};
