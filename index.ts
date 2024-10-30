// import Nonoql from "@/core";
// import { z } from "zod";

// const db = new Nonoql<"Account" | "Products">();

// function* counter(limit: number) {
//   for (let index = 0; index < limit; index++) {
//     yield {
//       name: `Generic ${index}`
//     };
//   }
// }

// (async () => {
//   await db.load();

// })();

import { readdir, stat } from 'node:fs/promises';

// console.log(await readdir("./"));
console.log((await stat(`${import.meta.dirname}/core`)).isFile());
