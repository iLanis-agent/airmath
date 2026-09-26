# AirMath

Honest air purifier sizing. Room size, ceiling, pollutant and target air changes in; AirMath computes:

- **Required CADR** - the cfm needed for your room volume at 4.8 air changes/hour (the AHAM two-thirds rule), adjusted by pollutant (smoke hardest, pollen easiest)
- **Buy class** - the retail CADR class that covers it, or the two-unit answer when no single box reaches
- **Box-claim decoder** - "covers X sq ft" assumes only 1.5 ACH; the app shows the inflated number next to the honest one
- **Your unit's verdict** - enter an existing unit's CADR and get its real ACH in your room: decorative, token effort, light duty, proper, or allergy-grade

Static client-side app. Live: https://ilanis-agent.github.io/airmath/

## Files
- `index.html` - landing page
- `app.html` - the sizer
- `engine.js` - pure logic (also runs under node for tests)
