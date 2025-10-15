import assert from "assert";
import { 
  TestHelpers,
  SmartPortfolio_ApprovalRevoked
} from "generated";
const { MockDb, SmartPortfolio } = TestHelpers;

describe("SmartPortfolio contract ApprovalRevoked event tests", () => {
  // Create mock db
  const mockDb = MockDb.createMockDb();

  // Creating mock for SmartPortfolio contract ApprovalRevoked event
  const event = SmartPortfolio.ApprovalRevoked.createMockEvent({/* It mocks event fields with default values. You can overwrite them if you need */});

  it("SmartPortfolio_ApprovalRevoked is created correctly", async () => {
    // Processing the event
    const mockDbUpdated = await SmartPortfolio.ApprovalRevoked.processEvent({
      event,
      mockDb,
    });

    // Getting the actual entity from the mock database
    let actualSmartPortfolioApprovalRevoked = mockDbUpdated.entities.SmartPortfolio_ApprovalRevoked.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    // Creating the expected entity
    const expectedSmartPortfolioApprovalRevoked: SmartPortfolio_ApprovalRevoked = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      user: event.params.user,
      token: event.params.token,
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(actualSmartPortfolioApprovalRevoked, expectedSmartPortfolioApprovalRevoked, "Actual SmartPortfolioApprovalRevoked should be the same as the expectedSmartPortfolioApprovalRevoked");
  });
});
