// Collects audit findings. `fail` records a blocking error; `flag` records a
// human-review warning. Checks push into one shared collector so the orchestrator
// can decide the exit code in a single place.
export const createFindings = () => {
  const errors = [];
  const warnings = [];
  return {
    fail: (message) => errors.push(message),
    flag: (message) => warnings.push(message),
    errors,
    warnings,
  };
};
