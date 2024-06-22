import { expect } from "chai";
import { Program } from "../program.js";

describe("Program", () => {
  [
    ["it is not an object", 5],
    ["it null", null],
    ["one profile lacks the 'blockchain' key", {
      ethereum_local: {
        url: "localhost:8545",
      },
      tezos_local: {
        blockchain: "tezos",
        url: "localhost:8732",
      },
    }],
    ["one profile lacks the 'url' key", {
      ethereum_local: {
        blockchain: "ethereum",
      },
      tezos_local: {
        blockchain: "tezos",
        url: "localhost:8732",
      },
    }],
    ["one profile has an invalid blockchain", {
      ethereum_local: {
        blockchain: "bitcoin",
        url: "localhost:8545",
      },
      tezos_local: {
        blockchain: "tezos",
        url: "localhost:8732",
      },
    }],
  ].forEach(([s, profiles]) => {
    it(`does not validate a set of profiles when ${s}`, () => {
      expect(Program.isProfileSet(profiles)).to.be.false;
    });
  });

  it("valides a set of profiles", () => {
    expect(Program.isProfileSet({
      ethereum_local: {
        blockchain: "ethereum",
        url: "localhost:8545",
      },
      tezos_local: {
        blockchain: "tezos",
        url: "localhost:8732",
      },
    })).to.be.true;
  });

  it("fails to describe an empty set of profiles", () => {
    const program = new Program({});

    expect(() => program.describeProfiles()).to.throw("No profiles loaded");
  });

  it("describes a set with more than 1 profiles", () => {
    const program = new Program({
      ethereum_local: {
        blockchain: "ethereum",
        url: "localhost:8545",
      },
      tezos_local: {
        blockchain: "tezos",
        url: "localhost:8732",
      },
    });

    expect(program.describeProfiles()).to.equal(`2 profiles loaded.

Name: ethereum_local
Blockchain: Ethereum
Node URL: localhost:8545

Name: tezos_local
Blockchain: Tezos
Node URL: localhost:8732`);
  });

  it("describes a set with 1 profile", () => {
    const program = new Program({
      tezos_local: {
        blockchain: "tezos",
        url: "localhost:8732",
      },
    });

    expect(program.describeProfiles()).to.equal(`1 profile loaded.

Name: tezos_local
Blockchain: Tezos
Node URL: localhost:8732`);
  });

  it("fails to describe a missing profile", () => {
    const program = new Program({});

    expect(() => program.describeProfile("missing")).to.throw("Profile not found 'missing'");
  });

  it("describes a profile", () => {
    const program = new Program({
      tezos_local: {
        blockchain: "tezos",
        url: "localhost:8732",
      },
    });

    expect(program.describeProfile("tezos_local")).to.equal(`Name: tezos_local
Blockchain: Tezos
Node URL: localhost:8732`);
  });
});
