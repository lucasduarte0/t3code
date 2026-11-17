import {
  IsoDateTime,
  OrchestratorMcpEnvironmentTarget,
  OrchestratorMcpFailure,
  ServerProvider,
  ServerProviderUsageLimits,
  UsageLimitSourceSnapshot,
} from "@t3tools/contracts";
import * as Schema from "effect/Schema";
import { Tool, Toolkit } from "effect/ai";
import * as ProviderRegistry from "../../../provider/ProviderRegistry.ts";
import * as UsageLimitSources from "../../../usage/UsageLimitSources.ts";
import * as McpInvocationContext from "../../McpInvocationContext.ts";
import * as ThreadManagementService from "../../../orchestration-v2/ThreadManagementService.ts";

const ProviderUsageTool = Tool.make("t3_provider_usage", {
  description:
    "Read current provider quota and limit snapshots for an environment. Does not refresh providers or return usage history.",
  failure: OrchestratorMcpFailure,
  failureMode: "return" as const,
  dependencies: [
    McpInvocationContext.McpInvocationContext,
    ThreadManagementService.ThreadManagementService,
    ProviderRegistry.ProviderRegistry,
    UsageLimitSources.UsageLimitSources,
  ],
  parameters: Schema.Struct({ environmentId: OrchestratorMcpEnvironmentTarget }),
  success: Schema.Struct({
    readAt: IsoDateTime,
    providers: Schema.Array(
      Schema.Struct({
        instanceId: ServerProvider.fields.instanceId,
        driver: ServerProvider.fields.driver,
        limits: Schema.NullOr(ServerProviderUsageLimits),
      }),
    ),
    sources: Schema.Array(UsageLimitSourceSnapshot),
  }),
})
  .annotate(Tool.Readonly, true)
  .annotate(Tool.Destructive, false);

export const UsageToolkit = Toolkit.make(ProviderUsageTool);
