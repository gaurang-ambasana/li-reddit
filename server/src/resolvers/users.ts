import { RequiredEntityData } from "@mikro-orm/core";
import { User } from "../entities/User";
import { MyContext } from "src/types";
import { Arg, Ctx, Mutation, Query, Resolver } from "type-graphql";
import argon2 from "argon2";
import { UsernamePasswordInput } from "./types/UsernamePasswordInput";
import { UserResponse } from "./types/UserResponse";

@Resolver()
export class UserResolver {
  @Query(() => [User])
  users(@Ctx() { em }: MyContext): Promise<User[]> {
    return em.find(User, {});
  }

  @Mutation(() => User)
  async register(
    @Arg("options", () => UsernamePasswordInput) options: UsernamePasswordInput,
    @Ctx() { em }: MyContext
  ): Promise<User> {
    const { username, password: plainPassword } = options;
    const hashedPassword = await argon2.hash(plainPassword);
    const user = em.create(User, {
      username,
      password: hashedPassword,
    } as RequiredEntityData<User>);
    await em.persistAndFlush(user);
    return user;
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("options", () => UsernamePasswordInput) options: UsernamePasswordInput,
    @Ctx() { em }: MyContext
  ): Promise<UserResponse> {
    const { username, password: plainPassword } = options;

    const user = await em.findOne(User, { username });

    if (!user) {
      return {
        errors: [
          {
            field: "username",
            message: `that username doesn't exists`,
          },
        ],
      };
    }

    const valid = await argon2.verify(user.password, plainPassword);

    if (!valid) {
      return {
        errors: [
          {
            field: "password",
            message: `that password doesn't match`,
          },
        ],
      };
    }

    return {
      user,
    };
  }
}
