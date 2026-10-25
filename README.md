# Fold Studio

Design flat. See it folded. A browser-based packaging design studio: design artwork on a flat dieline and see it folded onto live 3D geometry.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # geometry, schema and editor-history tests
npm run build      # production build
```

No environment variables are needed. Projects and uploaded images are stored locally in the browser (IndexedDB). See `.env.example` for the variables a future Supabase cloud mode would use.

## How it fits together

- `src/lib/templates/` — each template builds a typed **dieline** (panels, outlines, hinges) from width × height × depth.
- `src/lib/fold.ts` — hinge math that folds the dieline into 3D. The 3D model, tests and exports all use it, so 2D and 3D can't drift apart.
- `src/lib/render/canvas.ts` and `svg.ts` — draw the same artwork objects to 3D textures and to SVG exports; `components/editor/ObjectSvg.tsx` draws them in the editor.
- `src/store/editor.ts` — editor state with bounded undo/redo (drags and typing are recorded as single steps).
- `src/lib/storage/db.ts` — a `ProjectRepository` interface with the local IndexedDB implementation.

## What works

Landing page with a live folding hero and an interactive 2D→3D demo, dashboard (create, open, search, sort, rename, duplicate, delete, import/export), template gallery, and the editor: SVG dieline canvas with cut/fold lines, safe-area guides, grid and dimensions; text, image/logo, rectangle, circle, line and vector shapes; move, resize, rotate, lock, hide, rename, reorder, multi-select, snapping and panel hand-over; panel backgrounds; live 3D preview with fold and lid sliders, view presets, six materials, lighting, backgrounds and shadows; brand kit; autosave; keyboard shortcuts; PNG (up to 3×, transparent), 1:1 SVG dieline and project-file exports.

## Not yet built

- Accounts, Supabase cloud sync and the Studio/Team plans (sign-in page explains guest mode).
- Sleeves, labels, inserts and packaging-set templates.
- Production prepress: bleed, CMYK/colour profiles, font outlining or embedding, image-resolution checks, board-thickness and crease tolerances. Exported SVGs are visual dielines, not printer-approved files.
- Custom font upload, image cropping beyond fit/fill, and a bleed overlay in the editor.
- Mailer side walls carry artwork in dieline orientation (rotate text 90° on them).
