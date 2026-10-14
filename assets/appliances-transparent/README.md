# Transparent Devices illustrations

These separate PNG exports are used only by the Devices list. Originals remain
unchanged in `../appliances/`; other screens retain their existing assets.

Created with the built-in imagegen background-extraction tool, one edit per asset.
The prompt for each appliance was:

> Remove ONLY the opaque off-white rectangular backdrop outside the large rounded
> pearl-white tile and its original soft shadow. Export genuine alpha transparency.
> Preserve the appliance, white details, rounded tile, rim, lighting, colour,
> placement, size and full square canvas. Keep smooth partially transparent shadow
> edges. No redraw, redesign, recolouring, resizing, cropping, checkerboard,
> additional tile, border or shadow; no white halo.

Validation: `node scripts/check-appliance-assets.mjs`. White and pale lavender
composites are reviewed separately; validation composites are not used in the UI.
