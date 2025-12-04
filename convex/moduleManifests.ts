import { storiesManifest } from '../modules/stories/manifest';
import { reportsManifest } from '../modules/reports/manifest';

export function getAllModuleManifests() {
  return [
    storiesManifest,
    reportsManifest,
  ];
}