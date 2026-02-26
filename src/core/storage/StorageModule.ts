/**
 * StorageModule — Singleton that returns the configured storage adapter.
 *
 * Currently always uses DigitalOceanSpacesAdapter.
 * Future: check STORAGE_PROVIDER env var to swap adapters (e.g. S3, GCS, local).
 */
import { DigitalOceanSpacesAdapter } from "./DigitalOceanSpacesAdapter";

export const storageAdapter = new DigitalOceanSpacesAdapter();
