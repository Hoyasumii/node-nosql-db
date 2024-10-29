import Nonoql from "@/core";
import { z } from "zod";

const db = new Nonoql();

function* counter(limit: number) {
  for (let index = 0; index < limit; index++) {
    yield `Match ${limit - index}`;
  }
}

(async () => {
  await db.load();

  // const zodSchema = z.object({
  //   name: z.string().min(4),
  //   email: z.string().email(),
  //   password: z.string().min(7),
  // });
  // type Account = z.infer<typeof zodSchema>;

  // await db.schema.create("Account", zodSchema);

  // await db.collection.create("Account", "Account");

  const userListSchema = z.object({
    name: z.string().min(4),
    content: z.array(z.string()),
  });

  type UserList = z.infer<typeof userListSchema>;

  await db.schema.create("UserList", userListSchema);

  await db.collection.create("UserList", "UserList");

  if (!db.collection) throw new Error();
  if (!db.schema) throw new Error();

  const userLists = db.collection.read<UserList>("UserList");

  const newUserList = await userLists?.create({
    name: "Alan",
    content: [],
  });

  console.log(await userLists?.update<"content">(
    (entity) => entity._id === newUserList?._id,
    (entity) => {
      for (let count of counter(5)) {
        entity.content.push(count);
      }
      return entity;
    }
  ));

  // const accounts = db.collection.read<Account>("Account");

  // console.log(accounts);
  // const account = await accounts?.create({
  //   name: "Alberto",
  //   email: "alanreisanjo@gmail.com",
  //   password: "umasenhaminha123",
  // });
  // console.log(account?._id);

  // a98f3093-2353-4e25-abb9-167a36e4080e

  // console.log(
  //   accounts?.findById("a98f3093-2353-4e25-abb9-167a36e4080e", [
  //     "email",
  //     "name",
  //     "password",
  //   ])
  // );

  // console.log(await accounts?.update((entity) => entity._createdAt === 1730145150965, {
  //   name: "Testando 3",

  // }))

  // console.log(await accounts?.update((entity) => entity._createdAt === 1730145150965, (entity, index) => {
  //   entity.name = `${entity.name} - ${index}`

  //   return entity;
  // }));

  // await accounts?.save();
})();
