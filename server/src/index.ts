import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from "./constants";
import { Post } from "./entities/Post";

const main = async () => {
  const orm = await MikroORM.init({
    entities: [Post],
    dbName: "lireddit",
    user: "postgres",
    password: "postgres",
    type: "postgresql",
    debug: !__prod__,
  });

  const post = orm.em.create(Post, { title: "give it a try" });
  await orm.em.persistAndFlush(post);
};

main().catch(console.error);