import profiles from "./profiles.json" assert { type: "json" };
import { Program } from "./program.js";

export function hello() {
  return "Hello World !";
}

function main() {
  if (Program.isProfileSet(profiles)) {
    new Program(profiles);
  } else {
    console.error("Could not start program. Content of `profiles.json` is invalid");
  }
}

main();
