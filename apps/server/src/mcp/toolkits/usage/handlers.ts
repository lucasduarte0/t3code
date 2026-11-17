import * as DateTime from "effect/DateTime";
import * as Effect from "effect/Effect";
import * as ProviderRegistry from "../../../provider/ProviderRegistry.ts";
import * as UsageLimitSources from "../../../usage/UsageLimitSources.ts";
import * as McpToolAccess from "../../McpToolAccess.ts";
import { UsageToolkit } from "./tools.ts";

export const layer = McpToolAccess.toLayer(UsageToolkit, {
  t3_provider_usage: McpToolAccess.reads(() =>
    Effect.gen(function* () {
      const providers = yield* (yield* ProviderRegistry.ProviderRegistry).getProviders;
      const sources = yield* (yield* UsageLimitSources.UsageLimitSources).current;
      const now = yield* DateTime.now;
      return {
        readAt: DateTime.formatIso(now),
        providers: providers.map(({ instanceId, driver, usageLimits }) => ({
          instanceId,
          driver,
          limits: usageLimits ?? null,
        })),
        sources,
      };
    }),
  ),
});
