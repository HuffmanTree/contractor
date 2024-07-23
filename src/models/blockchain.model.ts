import type { AbiConstructorFragment, AbiEventFragment, AbiFragment, AbiFunctionFragment } from "web3";

export function isEthereumAbiConstructorFragment(v: AbiFragment): v is AbiConstructorFragment {
  return v.type === "constructor";
}

export function isEthereumAbiEventFragment(v: AbiFragment): v is AbiEventFragment {
  return v.type === "event";
}

export function isEthereumAbiFunctionFragment(v: AbiFragment): v is AbiFunctionFragment {
  return v.type === "function";
}

export interface EthereumContractInfo {
  constructor: { input: Array<string> },
  functions: Array<{ name: string, input: Array<{ name: string, type: string }>, output: Array<string> }>,
  events: Array<{ name: string, input: Array<{ name: string, type: string, indexed: boolean }> }>,
}

export interface BlockchainProvider {
  getBalance(address: string): Promise<{ balance: string, unit: string }>;
  deploy({
    code,
    contract,
    parameters,
  }: {
    code: string,
    contract?: string,
    parameters?: Array<unknown>,
  }, privateKey: string): Promise<{ address: string, txHash: string, gasUsed: string }>;
  send({
    code,
    contract,
    address,
    entrypoint,
    parameters,
  }: {
    code: string,
    contract?: string,
    address: string,
    entrypoint: string,
    parameters?: Array<unknown>,
  }, privateKey: string): Promise<{ txHash: string, gasUsed: string }>;
}
