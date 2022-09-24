import type { Api } from "./Data";
import { RestApi } from "./rest_api";

export const api: Api = new RestApi();
export * from "./Data";
