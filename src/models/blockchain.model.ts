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
  getBalance(address: string): Promise<string>;
}
