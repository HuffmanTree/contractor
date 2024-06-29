import { Web3 } from "web3";
import type { BlockchainProvider } from "../models/blockchain.model.js";
import type { EthereumProfile } from "../models/profile.model.js";

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
