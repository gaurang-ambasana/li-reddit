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

  @Mutation(() => UserResponse)
  async register(
    @Arg("options", () => UsernamePasswordInput) options: UsernamePasswordInput,
    @Ctx() { em }: MyContext
  ): Promise<UserResponse> {
    const { username, password: plainPassword } = options;

    if (!username || username.length < 3)
      return {
        errors: [
          {
            field: "username",
            message: "username should be atleast 3 characters",
          },
        ],
      };

    if (!plainPassword || plainPassword.length < 5)
      return {
        errors: [
          {
            field: "password",
            message: "password should be atleast 5 characters",
          },
        ],
      };

    const hashedPassword = await argon2.hash(plainPassword);

    const user = em.create(User, {
      username,
      password: hashedPassword,
    } as RequiredEntityData<User>);

    try {
      await em.persistAndFlush(user);
    } catch ({ code, detail, message }) {
      if (code === "23505" || detail.includes("already exists"))
        return {
          errors: [
            {
              field: "username",
              message: `${username} is already taken`,
            },
          ],
        };
    }
    return {
      user,
    };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("options", () => UsernamePasswordInput) options: UsernamePasswordInput,
    @Ctx() { em }: MyContext
  ): Promise<UserResponse> {
    const { username, password: plainPassword } = options;

    const user = await em.findOne(User, { username });

    if (!user)
      return {
        errors: [
          {
            field: "username",
            message: `that username doesn't exists`,
          },
        ],
      };

    const valid = await argon2.verify(user.password, plainPassword);

    if (!valid)
      return {
        errors: [
          {
            field: "password",
            message: `that password doesn't match`,
          },
        ],
      };

    return {
      user,
    };
  }
}
