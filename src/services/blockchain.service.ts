import type { BlockchainProvider } from "../models/blockchain.model.js";
import { isEthereumProfile, isTezosProfile } from "../models/profile.model.js";
import { EthereumProvider } from "./ethereum.service.js";
import { TezosProvider } from "./tezos.service.js";

export class BlockchainProviderFactory {
  static fromProfile(profile: unknown): BlockchainProvider {
    if (isEthereumProfile(profile)) return new EthereumProvider(profile);
    if (isTezosProfile(profile)) return new TezosProvider(profile);
    throw new Error("Unrecognized profile");
  }
}
