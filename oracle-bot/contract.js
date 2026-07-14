export async function handle(state, action) {
  const input = action.input;
  const caller = action.caller;

  // Authorization check for Oracle
  if (state.oracleAddress && caller !== state.oracleAddress) {
    throw new ContractError("Unauthorized caller: only the oracle can update the status");
  }

  if (input.function === "updateStatus") {
    const status = input.status;
    
    // Validate input
    if (typeof status !== "string") {
      throw new ContractError("Invalid status value, must be a string");
    }

    if (!["alive", "dead", "unknown"].includes(status)) {
      throw new ContractError(`Invalid status: ${status}. Must be 'alive', 'dead', or 'unknown'`);
    }

    // Update state
    state.status = status;
    
    // Use SmartWeave global object for contextual information
    state.lastUpdatedAt = SmartWeave.block.timestamp;
    
    // History tracking (optional, useful for verifiable tracking)
    if (!state.history) {
      state.history = [];
    }
    
    state.history.push({
      status: status,
      timestamp: SmartWeave.block.timestamp,
      txId: SmartWeave.transaction.id
    });

    return { state };
  }

  throw new ContractError(`No function supplied or function not recognised: "${input.function}"`);
}
