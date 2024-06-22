import { expect } from "chai";
import { hello } from "../index.js";

describe("Index", () => {
  it("returns 'Hello World !'", () => {
    expect(hello()).to.equal("Hello World !");
  });
});
