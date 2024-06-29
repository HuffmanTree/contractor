import { isEthereumProfile, isTezosProfile, type EthereumProfile, type TezosProfile } from "../models/profile.model.js";

export class BlockchainProviderFactory {
  static fromProfile(profile: EthereumProfile): EthereumProvider;
  static fromProfile(profile: TezosProfile): TezosProvider;
  static fromProfile(profile: unknown): BlockchainProvider {
    if (isEthereumProfile(profile)) return new EthereumProvider();
    if (isTezosProfile(profile)) return new TezosProvider();
    throw new Error("Unrecognized profile");
  }
}

interface BlockchainProvider {}

export class EthereumProvider implements BlockchainProvider {}

export class TezosProvider implements BlockchainProvider {}
