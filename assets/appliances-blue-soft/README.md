# Soft blue appliance tiles

Built-in image-editing corrections of `../appliances-blue/*.png`. The blue appliance colours and 3D detail remain; the baked-in dark/coloured tile halos are replaced with a subtle neutral shadow. Older variants are retained separately.

Common editing prompt (with the appliance filename appended):

> Precise image edit, existing appliance PNG. Preserve the current appliance pixels, blue/periwinkle colouring, white body, 3D material detail, silhouette, scale, placement and canvas dimensions. Edit ONLY the surrounding rounded tile and its exterior shadow. Remove completely the thick dark grey/blue halo, blue coloured glow, dark outline and heavy drop shadow. The rounded tile should be clean pearl-white with barely perceptible edge definition. Outside it use only a VERY FAINT, NEUTRAL GREY, small diffuse contact shadow underneath, maximum visual darkness about 8%, smoothly fading to genuine alpha transparency. No blue tint in tile shadow, no hard perimeter line, no large raised bevel, no bright glowing rim. Keep existing tile size/shape and appliance size unchanged. Leave all pixels outside tile and small faint shadow transparent, including corners. Do not add an opaque white rectangular backdrop. This is to restore the understated original icon-tile appearance on a white device card.

Render on transparent image wrappers with contain sizing. Do not add another tile border or shadow. White/lavender comparison sheets are saved in the ignored `.expo/asset-review` directory for visual verification.
