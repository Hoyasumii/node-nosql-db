import NoNoQL from "@/core";
import { z } from "zod";

const db = new NoNoQL();

(async () => {
  await db.load();

  const zodSchema = z.object({
    name: z.string().min(4),
    email: z.string().email(),
    password: z.string().min(7),
  });
  type Account = z.infer<typeof zodSchema>;

  await db.schema.create("Account", zodSchema);

  await db.collection.create("Account", "Account");

  const accounts = db.collection.read<Account>("Account");

  // await accounts?.create({
  //   name: "Alberto",
  //   email: "alanreisanjo@gmail.com",
  //   password: "umasenhaminha123",
  // });
  console.log(accounts?.find(({ name }) => name === "Alberto"));
  await accounts?.save();
})();
