/* AirMath engine - honest air purifier CADR sizing. Pure logic, no DOM. */
(function (root) {
  'use strict';

  var M2_TO_SQFT = 10.7639;
  var M_TO_FT = 3.28084;
  var DEFAULT_ACH = 4.8;          /* AHAM "two-thirds rule" assumes ~4.8 air changes/hour at 8 ft */
  var POLLUTANTS = {
    smoke:  { label: 'Smoke / wildfire', factor: 1.0,  note: 'smallest, hardest particles - size on the smoke CADR' },
    dust:   { label: 'Dust', factor: 0.95, note: 'mid-size particles' },
    pollen: { label: 'Pollen / allergies', factor: 0.9, note: 'largest particles - easiest to catch' }
  };

  function num(x, name, min, max) {
    var v = Number(x);
    if (!isFinite(v) || v < min || v > max) throw new Error(name + ' must be between ' + min + ' and ' + max);
    return v;
  }

  function achBand(ach) {
    if (ach < 2) return 'decorative';
    if (ach < 3) return 'token effort';
    if (ach < 4.8) return 'light duty';
    if (ach < 6) return 'proper';
    return 'allergy-grade';
  }

  /* Required CADR in cfm for the room at target ACH. */
  function requiredCadr(areaM2, ceilingM, ach, pollutantKey) {
    var sqft = areaM2 * M2_TO_SQFT;
    var ft = ceilingM * M_TO_FT;
    var p = POLLUTANTS[pollutantKey];
    return Math.ceil((sqft * ft * ach / 60) * p.factor);
  }

  /* ACH a given CADR actually delivers in the room. */
  function achFor(cadrCfm, areaM2, ceilingM) {
    var volFt3 = areaM2 * M2_TO_SQFT * ceilingM * M_TO_FT;
    return cadrCfm * 60 / volFt3;
  }

  /* What manufacturers usually mean by "covers X sq ft": ~1.5 ACH. */
  function marketedSqft(cadrCfm, ceilingM) {
    var volFt3PerSqft = ceilingM * M_TO_FT;
    return Math.round(cadrCfm * 60 / (1.5 * volFt3PerSqft));
  }

  function analyze(input) {
    if (!input || typeof input !== 'object') throw new Error('No input');
    var areaM2 = num(input.areaM2, 'Room area', 4, 200);
    var ceilingM = input.ceilingM == null || input.ceilingM === '' ? 2.5 : num(input.ceilingM, 'Ceiling height', 2, 5);
    var ach = input.ach == null || input.ach === '' ? DEFAULT_ACH : num(input.ach, 'Air changes per hour', 1, 8);
    var pKey = String(input.pollutant || 'smoke');
    if (!POLLUTANTS[pKey]) throw new Error('Pick a pollutant');
    var haveCadr = input.unitCadr == null || input.unitCadr === '' ? null : num(input.unitCadr, 'Unit CADR', 20, 1000);

    var p = POLLUTANTS[pKey];
    var req = requiredCadr(areaM2, ceilingM, ach, pKey);
    var sqft = Math.round(areaM2 * M2_TO_SQFT);

    /* common retail CADR classes */
    var CLASSES = [100, 150, 200, 250, 300, 350, 400, 450, 550];
    var pick = null;
    for (var i = 0; i < CLASSES.length; i++) if (CLASSES[i] >= req) { pick = CLASSES[i]; break; }
    var twoUnits = pick === null;
    if (twoUnits) pick = Math.ceil(req / 2 / 50) * 50;

    var verdict = 'A ' + areaM2 + ' m2 room (' + sqft + ' sq ft, ' + ceilingM + ' m ceiling) needs a smoke CADR of about ' +
      req + ' cfm for ' + ach + ' air changes an hour - ' + p.note + '. ' +
      (twoUnits ? 'No single retail unit reaches that; run two ~' + pick + ' cfm units. ' : 'That lands in the ' + pick + ' cfm class. ') +
      'Ignore "covers ' + marketedSqft(req, ceilingM) + ' sq ft" box claims - that number assumes only 1.5 air changes an hour.';

    var unit = null;
    if (haveCadr != null) {
      var achNow = Math.round(achFor(haveCadr, areaM2, ceilingM) * 10) / 10;
      var band = achBand(achNow);
      var marketed = marketedSqft(haveCadr, ceilingM);
      unit = {
        cadr: haveCadr,
        ach: achNow,
        band: band,
        marketedSqft: marketed,
        enough: haveCadr >= req
      };
      verdict += ' Your ' + haveCadr + ' cfm unit delivers ' + achNow + ' ACH here - "' + band + '"' +
        (unit.enough ? ', which covers the need.' : ', short of the ' + req + ' cfm target.') +
        ' The box likely claims ~' + marketed + ' sq ft.';
    }

    return {
      sqft: sqft,
      ceilingM: ceilingM,
      ach: ach,
      pollutant: p.label,
      requiredCadr: req,
      classCadr: pick,
      twoUnits: twoUnits,
      unit: unit,
      verdict: verdict
    };
  }

  var api = { analyze: analyze, requiredCadr: requiredCadr, achFor: achFor, marketedSqft: marketedSqft, achBand: achBand, POLLUTANTS: POLLUTANTS, DEFAULT_ACH: DEFAULT_ACH };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.AirMathEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
