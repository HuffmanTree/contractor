import { TezosToolkit } from "@taquito/taquito";
import { Web3 } from "web3";
import { isEthereumProfile, isTezosProfile, type EthereumProfile, type TezosProfile } from "../models/profile.model.js";

export class BlockchainProviderFactory {
  static fromProfile(profile: EthereumProfile): EthereumProvider;
  static fromProfile(profile: TezosProfile): TezosProvider;
  static fromProfile(profile: unknown): BlockchainProvider {
    if (isEthereumProfile(profile)) return new EthereumProvider(profile);
    if (isTezosProfile(profile)) return new TezosProvider(profile);
    throw new Error("Unrecognized profile");
  }
}

interface BlockchainProvider {
  getBalance(address: string): Promise<string>;
}

export class EthereumProvider implements BlockchainProvider {
  private readonly _client: Web3;

  constructor(profile: EthereumProfile) {
    this._client = new Web3(profile.url);
  }

  async getBalance(address: string): Promise<string> {
    const balance = await this._client.eth.getBalance(address);
    return balance.toString();
  }
}

export class TezosProvider implements BlockchainProvider {
  private readonly _client: TezosToolkit;

  constructor(profile: TezosProfile) {
    this._client = new TezosToolkit(profile.url);
  }

  async getBalance(address: string): Promise<string> {
    const balance = await this._client.rpc.getBalance(address);
    return balance.toString();
  }
}
