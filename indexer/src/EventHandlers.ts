/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import {
  SmartPortfolio,
  SmartPortfolio_ApprovalRevoked,
  SmartPortfolio_DynamicAllocationSet,
  SmartPortfolio_OwnershipTransferred,
  SmartPortfolio_Paused,
  SmartPortfolio_RebalanceExecuted,
  SmartPortfolio_Unpaused,
} from "generated";

SmartPortfolio.ApprovalRevoked.handler(async ({ event, context }) => {
  const entity: SmartPortfolio_ApprovalRevoked = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    user: event.params.user,
    token: event.params.token,
  };

  context.SmartPortfolio_ApprovalRevoked.set(entity);
});

SmartPortfolio.DynamicAllocationSet.handler(async ({ event, context }) => {
  const entity: SmartPortfolio_DynamicAllocationSet = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    user: event.params.user,
    tokens: event.params.tokens,
    percents: event.params.percents,
  };

  context.SmartPortfolio_DynamicAllocationSet.set(entity);
});

SmartPortfolio.OwnershipTransferred.handler(async ({ event, context }) => {
  const entity: SmartPortfolio_OwnershipTransferred = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    previousOwner: event.params.previousOwner,
    newOwner: event.params.newOwner,
  };

  context.SmartPortfolio_OwnershipTransferred.set(entity);
});

SmartPortfolio.Paused.handler(async ({ event, context }) => {
  const entity: SmartPortfolio_Paused = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    by: event.params.by,
  };

  context.SmartPortfolio_Paused.set(entity);
});

SmartPortfolio.RebalanceExecuted.handler(async ({ event, context }) => {
  const entity: SmartPortfolio_RebalanceExecuted = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    user: event.params.user,
    executor: event.params.executor,
    tokenIn: event.params.tokenIn,
    tokenOut: event.params.tokenOut,
    amountIn: event.params.amountIn,
    amountOut: event.params.amountOut,
    reason: event.params.reason,
    timestamp: event.params.timestamp,
  };

  context.SmartPortfolio_RebalanceExecuted.set(entity);
});

SmartPortfolio.Unpaused.handler(async ({ event, context }) => {
  const entity: SmartPortfolio_Unpaused = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    by: event.params.by,
  };

  context.SmartPortfolio_Unpaused.set(entity);
});
