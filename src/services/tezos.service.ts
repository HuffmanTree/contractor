import { TezosToolkit } from "@taquito/taquito";
import type { BlockchainProvider } from "../models/blockchain.model.js";
import type { TezosProfile } from "../models/profile.model.js";

export class TezosProvider implements BlockchainProvider {
  private readonly _client: TezosToolkit;

  constructor(profile: TezosProfile) {
    this._client = new TezosToolkit(profile.url);
  }

  async getBalance(address: string): Promise<{ balance: string, unit: string }> {
    const balance = await this._client.rpc.getBalance(address);
    return { balance: balance.toString(), unit: "µꜩ" };
  }
}
