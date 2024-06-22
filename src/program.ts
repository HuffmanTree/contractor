import { isEthereumProfile, isTezosProfile, type BlockchainProfile } from "./models/profile.model.js";

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

    return `Name: ${name}
Blockchain: ${profile.blockchain[0].toUpperCase() + profile.blockchain.substring(1)}
Node URL: ${profile.url}`;
  }

  public describeProfiles() {
    const keys = Object.keys(this.profiles);

    if (!keys.length) {
      throw new Error("No profiles loaded");
    }

    let res = `${keys.length} profile${keys.length > 1 ? "s" : ""} loaded.\n\n`;

    res += keys.map(this.describeProfile.bind(this)).join("\n\n");

    return res;
  }
}
