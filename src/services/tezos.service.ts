import { Parser } from "@taquito/michel-codec";
import { InMemorySigner } from "@taquito/signer";
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

  async deploy({
    code,
    parameters,
  }: {
    code: string,
    parameters?: Array<unknown>,
  }, privateKey: string): Promise<{ address: string, txHash: string, gasUsed: string }> {
    this._client.setSignerProvider(new InMemorySigner(privateKey));
    const p = new Parser();
    const parsed = p.parseScript(code);
    if (!parsed) throw new Error("Can not parse Michelson file");
    const op = await this._client.contract.originate({ code: parsed, storage: (parameters || [])[0] });
    const { address } = await op.contract();
    return { address, txHash: op.hash, gasUsed: op.consumedGas ?? "0" };
  }
}
