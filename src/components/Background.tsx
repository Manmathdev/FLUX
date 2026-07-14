/**
 * Full-bleed background layer (z-0).
 *
 * OFFLINE / SOLID: the smoky video background has been removed so the app needs
 * no network connection and loads instantly with zero GPU cost. The base is a
 * flat, pure black (#000) — exactly the spec's "pure black base" that already
 * sat beneath the video. Every layer above (glass, rims, content) is unchanged,
 * so the whole UI stays pixel-identical, only without the smoke.
 */
export function Background() {
  return <div className="bg-solid" />;
}
