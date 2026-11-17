import { expect, it } from "@effect/vitest";
import {
  EnvironmentId,
  ProviderDriverKind,
  ProviderInstanceId,
  UsageLimitSourceId,
} from "@t3tools/contracts";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Stream from "effect/Stream";
import * as ThreadManagementService from "../../../orchestration-v2/ThreadManagementService.ts";
import * as ProviderRegistry from "../../../provider/ProviderRegistry.ts";
import * as UsageLimitSources from "../../../usage/UsageLimitSources.ts";
import * as McpInvocationContext from "../../McpInvocationContext.ts";
import * as McpToolAccess from "../../McpToolAccess.ts";
import * as UsageHandlers from "./handlers.ts";
import { UsageToolkit } from "./tools.ts";

it.effect("returns current limits and sources, including providers without a snapshot", () =>
  Effect.gen(function* () {
    const limits = { checkedAt: "2026-01-01T00:00:00.000Z", windows: [] };
    const provider = {
      instanceId: ProviderInstanceId.make("one"),
      driver: ProviderDriverKind.make("codex"),
      status: "ready" as const,
      enabled: true,
      installed: true,
      auth: { status: "authenticated" as const },
      checkedAt: limits.checkedAt,
      version: null,
      models: [],
      slashCommands: [],
      skills: [],
      usageLimits: limits,
    };
    const source = {
      id: UsageLimitSourceId.make("hub"),
      kind: "cliproxy" as const,
      label: "Hub",
      checkedAt: limits.checkedAt,
      accounts: [],
    };
    const dependencies = Layer.mergeAll(
      Layer.mock(ThreadManagementService.ThreadManagementService)({}),
      Layer.succeed(McpInvocationContext.McpInvocationContext, {
        environmentId: EnvironmentId.make("env"),
        requestNamespace: "test",
        thread: undefined,
        client: undefined,
        capabilities: new Set<"orchestration">(),
        issuedAt: 0,
      }),
      Layer.mock(ProviderRegistry.ProviderRegistry)({
        getProviders: Effect.succeed([
          provider,
          { ...provider, instanceId: ProviderInstanceId.make("two"), usageLimits: undefined },
        ]),
      }),
      Layer.mock(UsageLimitSources.UsageLimitSources)({ current: Effect.succeed([source]) }),
    );
    const result = yield* Effect.gen(function* () {
      const toolkit = yield* UsageToolkit;
      return yield* toolkit.handle("t3_provider_usage", {}).pipe(Stream.unwrap, Stream.runCollect);
    }).pipe(
      Effect.provide(
        McpToolAccess.HandlersLayer.layer(UsageHandlers.layer).pipe(
          Layer.provideMerge(dependencies),
        ),
      ),
    );
    expect(result.at(-1)?.result).toEqual({
      readAt: "1970-01-01T00:00:00.000Z",
      providers: [
        { instanceId: provider.instanceId, driver: provider.driver, limits },
        { instanceId: "two", driver: provider.driver, limits: null },
      ],
      sources: [source],
    });
  }),
);
