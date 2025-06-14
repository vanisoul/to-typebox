import {
  type Static,
  type TBoolean,
  type TDate,
  type TNull,
  type TNumber,
  type TObject,
  type TOptional,
  type TSchema,
  type TString,
  type TSymbol,
  type TUnion,
  type TArray,
  Type,
} from "@sinclair/typebox";

type PrimitiveToSchema<T> = T extends string ? TString
  : T extends number ? TNumber
  : T extends boolean ? TBoolean
  : T extends bigint ? TNumber
  : T extends symbol ? TSymbol
  : T extends Date ? TDate
  : T extends Array<infer U> ? TArray<SchemaOf<U>>
  : T extends null ? TNull
  : T extends object ? TObject<Convert<T>>
  : never;

// 偵測是否是 union
type IsUnion<T> = (T extends any ? (x: T) => 0 : never) extends
  (x: infer I) => 0 ? [T] extends [I] ? false : true : false;

type SchemaOf<T> = IsUnion<T> extends true ? TUnion<[ToSchemaTuple<T>]>
  : PrimitiveToSchema<T>;

type ToSchemaTuple<U> = U extends any ? PrimitiveToSchema<U>
  : never extends U ? never
  : never;

type Convert<T> = T extends TSchema ? T : {
  [K in keyof T]-?: undefined extends T[K]
    ? TOptional<SchemaOf<NonNullable<T[K]>>>
    : SchemaOf<T[K]>;
};
type ToTypeBox<T> = TObject<Convert<T>>;

interface UserDB {
  no: number | string;
  list: (string|number)[];
  name?: string;
  r?: Record<string, number>;
  profile: {
    // bio: string|number;
    followers?: number | null;
  };
}

type UserDBSchema = ToTypeBox<UserDB>;
type UserDBOriginal = Static<UserDBSchema>;

// UserDBOriginal === UserDB

// const userDTOSchema = Type.Object({
//   no: Type.String(),
//   name: Type.String(),
//   follower: Type.Number(),
// });

// type UserDTO = Static<typeof userDTOSchema>;

// function dbToDto<DB, DTO>(definition: (db: DB) => DTO, data: DB, schema: {
//   // dbSchema: Convert<DB>,
//   dtoSchema: ToTypeBox<DTO>;
// }): DTO {
//   return definition(data);
// }

// import { Type } from "@sinclair/typebox";

// const result = dbToDto<UserDB, UserDTO>(
//   (db) => ({
//     no: db.no.toString(),
//     name: db.name ?? "",
//     follower: db.profile.followers ?? 0,
//   }),
//   { no: 123, name: "John", profile: { followers: null },list:["s"] },
//   {
//     dtoSchema: userDTOSchema,
//   },
// );

// console.log(result);
