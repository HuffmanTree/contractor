import { isEthereumProfile, isTezosProfile, type BlockchainProfile } from "./models/profile.model.js";
import { BlockchainProviderFactory } from "./services/blockchain.service.js";

export class Program {
  constructor(private readonly profiles: Record<string, BlockchainProfile>) {}

  static isProfileSet(profiles: unknown): profiles is Record<string, BlockchainProfile> {
    return !!profiles
      && typeof profiles === "object"
      && Object.values(profiles).every(p => isEthereumProfile(p) || isTezosProfile(p));
  }

  public describeProfile(name: string) {
    const profile = this.profiles[name];

    if (!profile) {
      throw new Error(`Profile not found '${name}'`);
    }

    return { name, blockchain: profile.blockchain, url: profile.url };
  }

  public describeProfiles() {
    const keys = Object.keys(this.profiles);

    if (!keys.length) {
      throw new Error("No profiles loaded");
    }

    return keys.map(this.describeProfile.bind(this));
  }

  public getBalance(profile: unknown, account: string) {
    const provider = BlockchainProviderFactory.fromProfile(profile);
    return provider.getBalance(account);
  }
}
