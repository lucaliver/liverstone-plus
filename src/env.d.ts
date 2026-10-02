/** Injected by Vite from package.json. */
declare const __APP_VERSION__: string;
/** When this build was made (ISO time; the dev server's start time in dev). */
declare const __BUILD_TIME__: string;

interface ImportMetaEnv {
  /** Count endpoint of the stats service (`src/analytics/`); unset = no stats are sent. */
  readonly VITE_STATS_URL?: string;
}
