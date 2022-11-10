import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from "./constants";
import mikroOrmConfig from "./mikro-orm.config";
import express from "express";

const PORT = process.env.PORT || 4000;

const main = async () => {
  const orm = await MikroORM.init(mikroOrmConfig);
  await orm.getMigrator().up();

  const app = express();
  app.get("/", (req, res) => res.status(200).send("API is running..."));
  app.listen(PORT, () =>
    console.log(`Server up and running at ${PORT} and http://localhost:4000`)
  );
};

main().catch(console.error);
