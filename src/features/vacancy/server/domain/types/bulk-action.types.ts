export interface BulkActionFailure {
  id: string;
  reason: string;
}

export interface BulkActionResult {
  succeeded: string[];
  failed: BulkActionFailure[];
}
