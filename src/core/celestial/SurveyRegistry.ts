/**
 * Typed registry of the all-sky surveys the native celestial layer can show.
 *
 * The telescope panel already writes a survey identifier into
 * `uiStore.wwtBackgroundLayer`. This registry is keyed by that same identifier,
 * so it adds provenance, palette and imagery to the controls that already
 * exist rather than introducing a parallel selection mechanism.
 *
 * Cesium-free by design so it can be unit tested directly.
 */
import surveyData from '@/data/astronomy/surveys.json';

export type OfflinePriority = 'required' | 'preferred' | 'optional';

export interface SurveyPalette {
  star: string;
  grid: string;
  glow: string;
}

export interface SurveyPreview {
  /** Path served by the app, relative to the web root. */
  localPath: string;
  /** Where the imagery was obtained from, for attribution and refresh. */
  sourceUrl: string;
  /** Set once the file has been mirrored and hashed; null while unmirrored. */
  sha256: string | null;
}

export interface SurveyDefinition {
  id: string;
  /** Matches uiStore.wwtBackgroundLayer exactly. */
  layerValue: string;
  name: string;
  band: string;
  palette: SurveyPalette;
  allSkyPreview: SurveyPreview | null;
  attribution: string;
  license: string;
  offlinePriority: OfflinePriority;
}

export const SURVEY_METADATA = surveyData.metadata;
export const SURVEYS = surveyData.surveys as SurveyDefinition[];

const SURVEYS_BY_LAYER = new Map(SURVEYS.map((survey) => [survey.layerValue, survey]));
const SURVEYS_BY_ID = new Map(SURVEYS.map((survey) => [survey.id, survey]));

/** The survey used whenever a layer value is unknown or unset. */
export const DEFAULT_SURVEY: SurveyDefinition = SURVEYS_BY_LAYER.get('3D Solar System View') ?? SURVEYS[0];

export function getSurveyByLayerValue(layerValue: string | null | undefined): SurveyDefinition {
  if (!layerValue) return DEFAULT_SURVEY;
  return SURVEYS_BY_LAYER.get(layerValue) ?? DEFAULT_SURVEY;
}

export function getSurveyById(id: string): SurveyDefinition | undefined {
  return SURVEYS_BY_ID.get(id);
}

export function paletteForLayer(layerValue: string | null | undefined): SurveyPalette {
  return getSurveyByLayerValue(layerValue).palette;
}

export type SurveyAvailability = { state: 'ready'; source: string } | { state: 'unavailable'; reason: string };

/**
 * Resolves what the layer should actually draw for a survey.
 *
 * A survey with no mirrored preview is reported as explicitly unavailable
 * rather than silently falling back to a different survey's imagery — an
 * operator inspecting an X-ray sky must never be shown a visible-light one.
 */
export function resolveSurveyImagery(
  survey: SurveyDefinition,
  hasLocalAsset: (localPath: string) => boolean
): SurveyAvailability {
  if (!survey.allSkyPreview) {
    return {
      state: 'unavailable',
      reason: `${survey.name} has no all-sky preview; the layer renders grid, stars and pins only.`
    };
  }
  if (!hasLocalAsset(survey.allSkyPreview.localPath)) {
    return {
      state: 'unavailable',
      reason: `${survey.name} imagery is not mirrored locally (expected ${survey.allSkyPreview.localPath}).`
    };
  }
  return { state: 'ready', source: survey.allSkyPreview.localPath };
}
