import {
  type Static,
  type TArray,
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
} from "@sinclair/typebox";

/**
 * 將基礎型別 (primitive types) 映射為對應的 TypeBox schema。
 * 包含 string、number、boolean、bigint、symbol、Date、Array、null、物件等。
 */
type PrimitiveToSchema<T> = T extends string ? TString
  : T extends number ? TNumber
  : T extends boolean ? TBoolean
  : T extends bigint ? TNumber
  : T extends symbol ? TSymbol
  : T extends Date ? TDate
  : T extends Array<infer U>
    ? undefined extends U ? TArray<OptionalSchema<U>> : TArray<SchemaOf<U>>
  : T extends null ? TNull
  : T extends object ? TObject<Convert<T>>
  : never;

/**
 * 判斷某個型別是否為 union。
 * 若是 union，則 `(x: T) => 0` 將對應多個簽名而不是單一簽名。
 */
type IsUnion<T> = (T extends any ? (x: T) => 0 : never) extends
  (x: infer I) => 0 ? [T] extends [I] ? false : true : false;

/**
 * 根據型別是否為 union 決定要用 TUnion 包起來還是單一 schema。
 */
type SchemaOf<T> = IsUnion<T> extends true ? TUnion<[ToSchemaTuple<T>]>
  : PrimitiveToSchema<T>;

/**
 * 將 union 類型轉為 TypeBox schema 組成的 tuple。
 * 例如：string | number → [TString, TNumber]
 */
type ToSchemaTuple<U> = U extends any ? PrimitiveToSchema<U>
  : never extends U ? never
  : never;

/**
 * 處理可選屬性（即型別中包含 undefined）。
 * 轉為 TypeBox 的 TOptional<SchemaOf<T>>。
 * 想要轉為也可為 NULL, 使用 `TOptional<TUnion<[SchemaOf<NonNullable<T[K]>>, TNull]>>`
 */
type OptionalSchema<T> = T extends any ? TOptional<SchemaOf<NonNullable<T>>>
  : never;

/**
 * 將一般物件型別（例如 interface）轉為 TypeBox 的 schema 結構。
 * 若值是 undefined，使用可選轉型；否則正常轉型。
 * 若已是 TSchema，則不轉型
 */
type Convert<T> = T extends TSchema ? T : {
  [K in keyof T]-?: undefined extends T[K] ? OptionalSchema<T[K]>
    : SchemaOf<T[K]>;
};

/**
 * 將完整型別轉為 TypeBox 的 TObject schema。
 * 可作為 interface → TypeBox 的最終輸出。
 */
type ToTypeBox<T> = TObject<Convert<T>>;


// 使用範例：將一個 UserDB 物件轉為 TypeBox schema

interface UserDB {
  no: number | string;
  list: (string | {bs:(string|undefined)[]})[];
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
