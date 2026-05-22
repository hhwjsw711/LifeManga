/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as authHelpers from "../authHelpers.js";
import type * as characters from "../characters.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as jobs from "../jobs.js";
import type * as lib_prompts from "../lib/prompts.js";
import type * as lib_storage from "../lib/storage.js";
import type * as mangaItems from "../mangaItems.js";
import type * as openai from "../openai.js";
import type * as projects from "../projects.js";
import type * as settings from "../settings.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  authHelpers: typeof authHelpers;
  characters: typeof characters;
  files: typeof files;
  http: typeof http;
  jobs: typeof jobs;
  "lib/prompts": typeof lib_prompts;
  "lib/storage": typeof lib_storage;
  mangaItems: typeof mangaItems;
  openai: typeof openai;
  projects: typeof projects;
  settings: typeof settings;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
