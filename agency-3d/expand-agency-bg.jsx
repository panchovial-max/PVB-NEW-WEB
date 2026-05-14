// ============================================================
// PVB Agency — Canvas Expand + Content-Aware Fill
// Expande agency-bg.jpg a 16:9 para mostrar bar y laterales
// Ejecutar en Photoshop: File > Scripts > Browse
// ============================================================

#target photoshop

var IMG_PATH  = "/Users/franciscovialbrown/Documents/GitHub/PVB-NEW-WEB/assets/agency-bg.jpg";
var SAVE_PATH = "/Users/franciscovialbrown/Documents/GitHub/PVB-NEW-WEB/assets/agency-bg-wide.jpg";

// Cuánto expandir a cada lado (porcentaje del ancho original)
var EXPAND_LEFT_PCT  = 30; // barra y espacio extra izquierda
var EXPAND_RIGHT_PCT = 35; // bar + ventanas ciudad derecha

// ── Abrir imagen ──────────────────────────────────────────────
var doc = open(new File(IMG_PATH));
var origW = doc.width.as("px");
var origH = doc.height.as("px");

var expandL = Math.round(origW * EXPAND_LEFT_PCT  / 100);
var expandR = Math.round(origW * EXPAND_RIGHT_PCT / 100);
var newW    = origW + expandL + expandR;

alert("Imagen original: " + origW + "x" + origH + "px\n" +
      "Nueva imagen: "    + newW  + "x" + origH + "px\n\n" +
      "Expandiendo canvas...");

// ── Aplanar y convertir a fondo ───────────────────────────────
doc.flatten();
var bg = doc.activeLayer;
bg.isBackgroundLayer = false;
bg.name = "original";

// ── Expandir canvas ───────────────────────────────────────────
doc.resizeCanvas(
    UnitValue(newW, "px"),
    UnitValue(origH, "px"),
    AnchorPosition.MIDDLECENTER
);

// ── Seleccionar zona izquierda vacía ──────────────────────────
doc.selection.select([
    [0,       0     ],
    [expandL, 0     ],
    [expandL, origH ],
    [0,       origH ]
]);
doc.selection.expand(4); // pequeño overlap para costura limpia
fillContentAware(doc);
doc.selection.deselect();

// ── Seleccionar zona derecha vacía ────────────────────────────
var xRight = expandL + origW - 4;
doc.selection.select([
    [xRight,  0     ],
    [newW,    0     ],
    [newW,    origH ],
    [xRight,  origH ]
]);
doc.selection.expand(4);
fillContentAware(doc);
doc.selection.deselect();

// ── Aplanar y guardar ─────────────────────────────────────────
doc.flatten();

var saveOpts = new JPEGSaveOptions();
saveOpts.quality = 11; // 0-12, 11 = alta calidad
saveOpts.embedColorProfile = true;
saveOpts.matte = MatteType.NONE;

doc.saveAs(new File(SAVE_PATH), saveOpts, true);

alert("✅ Guardado en:\n" + SAVE_PATH + "\n\n" +
      "Dimensiones: " + newW + "x" + origH + "px\n\n" +
      "Tip: Si las zonas expandidas no quedaron bien,\n" +
      "usa Generative Fill de Firefly sobre esas áreas.");

// ── Función Content-Aware Fill ────────────────────────────────
function fillContentAware(doc) {
    try {
        // Photoshop 2021+ Content-Aware Fill
        var idCAF = stringIDToTypeID("contentAwareFill");
        var desc  = new ActionDescriptor();
        var ref   = new ActionReference();
        ref.putEnumerated(charIDToTypeID("Lyr "),
                          charIDToTypeID("Ordn"),
                          charIDToTypeID("Trgt"));
        desc.putReference(charIDToTypeID("null"), ref);
        desc.putEnumerated(
            stringIDToTypeID("cafSamplingRegion"),
            stringIDToTypeID("cafSamplingRegion"),
            stringIDToTypeID("cafSamplingRegionRectangular")
        );
        desc.putBoolean(stringIDToTypeID("cafAutoColorAdaptation"),    true);
        desc.putBoolean(stringIDToTypeID("cafAutoRotationAdaptation"), true);
        desc.putBoolean(stringIDToTypeID("cafAutoScaleAdaptation"),    true);
        desc.putBoolean(stringIDToTypeID("cafMirrorAdaptation"),       false);
        desc.putEnumerated(
            stringIDToTypeID("cafOutputToNewLayer"),
            stringIDToTypeID("cafOutputToNewLayer"),
            stringIDToTypeID("cafOutputToCurrentLayer")
        );
        executeAction(idCAF, desc, DialogModes.NO);
    } catch(e) {
        // Fallback: Content-Aware simple (Photoshop CS6+)
        try {
            var fillDesc = new ActionDescriptor();
            fillDesc.putEnumerated(
                charIDToTypeID("Usng"),
                charIDToTypeID("FlCn"),
                stringIDToTypeID("contentAware")
            );
            fillDesc.putUnitDouble(charIDToTypeID("Opct"), charIDToTypeID("#Prc"), 100);
            fillDesc.putEnumerated(
                charIDToTypeID("Md  "),
                charIDToTypeID("BlnM"),
                charIDToTypeID("Nrml")
            );
            executeAction(charIDToTypeID("Fl  "), fillDesc, DialogModes.NO);
        } catch(e2) {
            alert("Content-Aware Fill no disponible.\n" +
                  "Usa Edit > Fill > Content-Aware manualmente\n" +
                  "o Generative Fill en las zonas seleccionadas.");
        }
    }
}
