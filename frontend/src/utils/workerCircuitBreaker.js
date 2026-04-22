/**
 * Worker Circuit Breaker
 * Prevents infinite worker restart loops by implementing circuit breaker pattern
 * - CLOSED: Normal operation
 * - OPEN: Worker failed max times, using sync fallback
 * - HALF_OPEN: Testing if worker recovered after timeout
 */
class WorkerCircuitBreaker {
  constructor({ maxFailures = 3, resetAfter = 30_000 } = {}) {
    this.failures = 0;
    this.maxFail = maxFailures;
    this.resetAfter = resetAfter;
    this.openAt = null;
    this.state = 'CLOSED'; // CLOSED | OPEN | HALF_OPEN
  }

  isOpen() {
    if (this.state === 'OPEN') {
      const elapsed = Date.now() - this.openAt;
      if (elapsed > this.resetAfter) {
        this.state = 'HALF_OPEN'; // Allow one probe
        return false;
      }
      return true; // Still open — use sync fallback
    }
    return false;
  }

  onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failures++;
    if (this.failures >= this.maxFail) {
      this.state = 'OPEN';
      this.openAt = Date.now();
      console.warn('[TokenWorker] Circuit breaker OPEN — falling back to sync');
    }
  }
}

export const workerBreaker = new WorkerCircuitBreaker();
