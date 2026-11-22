/**
 * BentoPDF (alam00000/bentopdf) Master Technical Deep-Dive
 * Exhaustive documentation of all 51 client-side WebAssembly tools,
 * architectural mechanics, and real-world workflows.
 */

export interface BentoTool {
  id: number;
  slug: string;
  name: string;
  category: 'Organize & Manage' | 'Edit & Annotate' | 'Convert to PDF' | 'Convert from PDF' | 'Security & Compliance';
  badge: string;
  tagline: string;
  plainEnglish: string;
  underTheHood: string;
  realWorldUse: string;
}

export interface BentoFaq {
  question: string;
  answer: string;
}

export const BENTO_PDF_META = {
  repoFullName: 'alam00000/bentopdf',
  repoName: 'BentoPDF',
  repoOwner: 'alam00000',
  stars: '400+',
  license: 'AGPL-3.0',
  officialWebsite: 'https://www.bentopdf.com/',
  githubUrl: 'https://github.com/alam00000/bentopdf',
  dockerHub: 'ghcr.io/alam00000/bentopdf-simple:latest',
  techStack: [
    'TypeScript',
    'Vite',
    'Tailwind CSS',
    'WebAssembly (WASM)',
    'MuPDF WASM',
    'Tesseract.js OCR',
    'pdf-lib',
    'PDF.js',
    'Docker',
  ],
  totalTools: 51,
  primaryArchitecture: 'Client-Side WebAssembly (Local Browser Memory Execution)',
};

export const BENTO_PDF_ARCHITECTURE = {
  summary:
    'BentoPDF executes document transformations locally within the user\'s web browser sandbox using compiled WebAssembly binaries (MuPDF, Tesseract.js, pdf-lib). Documents never leave the local environment during core processing.',
  corePillars: [
    {
      title: 'Local Browser Sandboxing',
      description:
        'Instead of streaming sensitive documents to an external API endpoint, files are loaded directly into browser memory (ArrayBuffer/Blob). All parsing, rendering, and serialization occur on the client machine.',
    },
    {
      title: 'Zero Data Retention & Privacy by Design',
      description:
        'Because processing is decentralized to the client, there is no centralized database or cloud file storage storing user files. When the browser tab closes, in-memory buffers are instantly purged by the browser garbage collector.',
    },
    {
      title: 'WebAssembly (WASM) Performance',
      description:
        'Heavy operations like rasterization, text rendering, and Optical Character Recognition run near-native C/C++ performance inside WebAssembly sandboxes without freezing the main browser thread.',
    },
    {
      title: 'Fully Offline & Self-Hostable',
      description:
        'Static assets and WASM modules can be cached locally or deployed in air-gapped environments via the standalone Docker image (bentopdf-simple), functioning without an active internet connection.',
    },
  ],
};

export const BENTO_TOOLS: BentoTool[] = [
  // ── GROUP 1: ORGANIZE & MANAGE (1-10) ──────────────────────────────────
  {
    id: 1,
    slug: 'merge-pdf',
    name: 'Merge PDFs',
    category: 'Organize & Manage',
    badge: 'Core Utility',
    tagline: 'Combine multiple independent PDF files into a single continuous document.',
    plainEnglish:
      'Like an electronic stapler. You take multiple separate PDFs—such as an agreement, a cover letter, and photo attachments—and combine them into one file in whatever order you prefer.',
    underTheHood:
      'Parses the binary cross-reference (xref) tables of each source PDF into memory via pdf-lib, instantiates a clean master Catalog, copies over page leaf dictionaries, re-assigns indirect object IDs to prevent collisions, and emits a single consolidated byte stream.',
    realWorldUse:
      'Compiling monthly financial statements, receipts, and invoices into one submission file for accounting and tax filing.',
  },
  {
    id: 2,
    slug: 'split-pdf',
    name: 'Split PDFs',
    category: 'Organize & Manage',
    badge: 'Page Extraction',
    tagline: 'Divide large documents by page intervals or extract targeted page ranges.',
    plainEnglish:
      'Like carefully cutting specific pages out of a book. If you have a 60-page manual, you can pull out pages 10 through 15 as their own file, or split the entire file into single-page documents.',
    underTheHood:
      'Traverses the /Pages tree dictionary of the document, duplicates the selected page object nodes along with their associated /Resources (embedded fonts, XObjects, color spaces), and serializes them into independent new PDF structures.',
    realWorldUse:
      'Extracting specific contract exhibits, single medical records, or architectural blueprint sheets from massive multi-page sets.',
  },
  {
    id: 3,
    slug: 'organize-reorder-pages',
    name: 'Organize & Reorder Pages',
    category: 'Organize & Manage',
    badge: 'Visual Layout',
    tagline: 'Interactive drag-and-drop thumbnail grid to rearrange and re-sequence pages.',
    plainEnglish:
      'Displays all pages of your PDF as visual cards on a table. You drag page 5 to the beginning, move page 2 to the end, or drop unwanted pages into the trash before saving.',
    underTheHood:
      'Renders high-speed thumbnail canvas previews in background Web Workers using PDF.js. When the user rearranges pages, it updates the `/Kids` array pointers in the `/Pages` catalog node without re-encoding the underlying content streams.',
    realWorldUse:
      'Correcting documents scanned out of order or arranging slides before an executive board presentation.',
  },
  {
    id: 4,
    slug: 'extract-pages',
    name: 'Extract Pages',
    category: 'Organize & Manage',
    badge: 'Document Isolation',
    tagline: 'Isolate designated pages into a new standalone PDF without altering the original.',
    plainEnglish:
      'Lets you pull out only the specific pages you need (such as just the signature page) while leaving the original master PDF completely unchanged.',
    underTheHood:
      'Clones targeted page descriptors into a new PDFDocument instance, copies their referenced Resource dictionaries, recalculates byte offsets, and prompts a clean browser download.',
    realWorldUse:
      'Legal teams isolating signature pages or tax preparers extracting Schedule C from an extensive tax return.',
  },
  {
    id: 5,
    slug: 'delete-pages',
    name: 'Delete Pages',
    category: 'Organize & Manage',
    badge: 'Content Removal',
    tagline: 'Permanently remove blank, erroneous, or redundant pages from a file.',
    plainEnglish:
      'A digital shredder for individual pages. If an office scanner produced 3 blank pages, or a document has an outdated clause page, you can delete them permanently.',
    underTheHood:
      'Excises the targeted page reference from the document Page Tree array and runs garbage collection during serialization to discard orphaned stream objects, reducing the overall file size.',
    realWorldUse:
      'Cleaning up scanned documents by removing blank separator sheets and accidental duplicates before archiving.',
  },
  {
    id: 6,
    slug: 'rotate-pages',
    name: 'Rotate Pages',
    category: 'Organize & Manage',
    badge: 'Orientation Correction',
    tagline: 'Rotate sideways or upside-down pages (90°, 180°, 270°) individually or in bulk.',
    plainEnglish:
      'Fixes pages that were scanned sideways or upside down so they can be read naturally on screens without tilting your head.',
    underTheHood:
      'Updates the `/Rotate` integer attribute in the target Page dictionary (supporting 0, 90, 180, and 270 degrees). This completes in milliseconds because it updates a metadata tag without re-encoding any image or text data.',
    realWorldUse:
      'Standardizing orientation on phone camera snapshots of contracts, driver licenses, or wide landscape spreadsheets.',
  },
  {
    id: 7,
    slug: 'n-up-multipage',
    name: 'N-Up / Multi-Page Imposition',
    category: 'Organize & Manage',
    badge: 'Print Imposition',
    tagline: 'Tile 2, 4, or 9 pages onto a single printed sheet to reduce paper usage.',
    plainEnglish:
      'Arranges multiple smaller pages onto a single physical sheet of paper. Useful for printing lecture slides, study sheets, or compact reference pamphlets.',
    underTheHood:
      'Creates a new master page and applies affine transformation matrices (scaling and translating) to draw multiple original page streams as Form XObjects inside a grid coordinate layout.',
    realWorldUse:
      'Printing presentation handouts or technical reference guides using 75% less physical paper.',
  },
  {
    id: 8,
    slug: 'pdf-viewer-reader',
    name: 'PDF Viewer / Canvas Reader',
    category: 'Organize & Manage',
    badge: 'Client Rendering',
    tagline: 'High-performance in-browser document reader running on HTML5 canvas.',
    plainEnglish:
      'A fast, lightweight PDF reader that opens and displays documents directly inside your web browser without installing Adobe Acrobat or external extensions.',
    underTheHood:
      'Uses PDF.js to parse PDF rendering commands directly onto HTML5 `<canvas>` viewports, accompanied by a synchronized transparent text layer to allow native text selection, search, and copy-pasting.',
    realWorldUse:
      'Reviewing and reading contracts, research papers, and technical specifications on devices without native PDF reader software.',
  },
  {
    id: 9,
    slug: 'bookmarks-toc-manager',
    name: 'Bookmarks & Outline Manager',
    category: 'Organize & Manage',
    badge: 'Navigation Structure',
    tagline: 'Create, modify, and restructure clickable document bookmarks and table-of-contents trees.',
    plainEnglish:
      'Builds the clickable chapter menu on the left side of a PDF reader. Clicking "Chapter 4: Financials" instantly jumps the view to page 50.',
    underTheHood:
      'Builds the `/Outlines` dictionary tree with `/First`, `/Last`, `/Next`, and `/Prev` pointers, linking text labels to explicit page coordinate destinations (`/Fit`, `/FitH`).',
    realWorldUse:
      'Structuring long technical manuals, company handbooks, and legal briefs so readers can navigate directly to key sections.',
  },
  {
    id: 10,
    slug: 'page-size-scaler',
    name: 'Page Sizer & Rescaling',
    category: 'Organize & Manage',
    badge: 'Standardization',
    tagline: 'Scale and normalize mixed-size pages into standard US Letter, A4, or Legal dimensions.',
    plainEnglish:
      'Takes documents with mismatched page sizes and scales them all to a uniform standard size, such as US Letter or international A4.',
    underTheHood:
      'Adjusts the `/MediaBox` and `/CropBox` coordinate rectangles and applies a proportional scale factor to the page content transformation matrix to prevent distortion.',
    realWorldUse:
      'Formatting foreign legal and corporate submissions to meet mandatory court or regulatory paper size rules.',
  },

  // ── GROUP 2: EDIT & ANNOTATE (11-21) ───────────────────────────────────
  {
    id: 11,
    slug: 'pdf-editor-annotator',
    name: 'Visual PDF Editor & Annotator',
    category: 'Edit & Annotate',
    badge: 'Direct Markup',
    tagline: 'Add freehand drawing, highlighter overlays, text boxes, geometric shapes, and notes.',
    plainEnglish:
      'A digital markup pen for your documents. You can circle paragraphs, highlight key sentences, draw arrows, or type extra notes anywhere on the page.',
    underTheHood:
      'Captures user vector paths and text entries on an interactive overlay canvas, then writes them into standard PDF Annotation dictionaries (`/Highlight`, `/Square`, `/FreeText`) or appends them directly to the page content stream.',
    realWorldUse:
      'Grading academic papers, reviewing architectural blueprints, and providing markup feedback on draft contracts.',
  },
  {
    id: 12,
    slug: 'add-page-numbers',
    name: 'Add Page Numbers',
    category: 'Edit & Annotate',
    badge: 'Pagination',
    tagline: 'Inject dynamic page numbers with customizable placement, offsets, and formats.',
    plainEnglish:
      'Automatically prints clean page numbers (like "Page 1 of 30") or legal Bates stamps at the top or bottom of every page in your document.',
    underTheHood:
      'Iterates through the page array, embeds a standard Type1 font (Helvetica or Times), calculates margin coordinates relative to the `/MediaBox`, and writes text drawing operators (`BT /F1 10 Tf (Page 1) Tj ET`) into each page stream.',
    realWorldUse:
      'Numbering formal reports, academic papers, and legal discovery productions to ensure accurate reference citations.',
  },
  {
    id: 13,
    slug: 'watermark-engine',
    name: 'Watermark Engine',
    category: 'Edit & Annotate',
    badge: 'Document Labeling',
    tagline: 'Stamp text, logos, or diagonal status indicators across all pages with adjustable opacity.',
    plainEnglish:
      'Places a semi-transparent label across every page—such as "CONFIDENTIAL", "DRAFT", or a company logo—so reviewers know the document status.',
    underTheHood:
      'Creates semi-transparent graphic states (`/ExtGState`) with configured `/CA` alpha values, rotating text or image XObjects at 45 degrees across the center of each page canvas.',
    realWorldUse:
      'Marking sensitive financial models, unreleased pitch decks, and internal memos to deter unauthorized sharing.',
  },
  {
    id: 14,
    slug: 'headers-and-footers',
    name: 'Headers & Footers',
    category: 'Edit & Annotate',
    badge: 'Branding & Context',
    tagline: 'Place running titles, dates, author names, and document codes in margin safe zones.',
    plainEnglish:
      'Adds consistent labels to the top and bottom margins of every page, such as the document title, creation date, or version number.',
    underTheHood:
      'Calculates margin boundaries outside the main text body and injects standardized typographic layout rules across the document page stream.',
    realWorldUse:
      'Adding corporate branding, copyright notices, and revision dates to client-facing proposals and whitepapers.',
  },
  {
    id: 15,
    slug: 'crop-pdf',
    name: 'Crop PDF Margins',
    category: 'Edit & Annotate',
    badge: 'Margin Adjustment',
    tagline: 'Trim excessive white borders or isolate specific diagrams and tables.',
    plainEnglish:
      'Cuts away empty white margins around a document, making the text larger and easier to read on tablets and small screens.',
    underTheHood:
      'Modifies the `/CropBox` and `/TrimBox` coordinate arrays within the PDF dictionary. The underlying vector data remains intact, but viewers are instructed to render only within the cropped boundary.',
    realWorldUse:
      'Optimizing academic research papers and scanned book pages for comfortable reading on e-readers and mobile devices.',
  },
  {
    id: 16,
    slug: 'color-inverter-dark-mode',
    name: 'Color Inverter (Dark Mode)',
    category: 'Edit & Annotate',
    badge: 'Visual Comfort',
    tagline: 'Invert bright white backgrounds to high-contrast dark themes to minimize eye strain.',
    plainEnglish:
      'Flips blinding white paper backgrounds to black, and changes black text to light grey, making long reading sessions much easier on the eyes.',
    underTheHood:
      'Applies a color-inversion transformation filter to canvas pixel buffers or inserts a custom Transfer Function dictionary that inverts luminosity values across the graphics state.',
    realWorldUse:
      'Reading dense technical documentation, code books, or study materials late at night or in low-light environments.',
  },
  {
    id: 17,
    slug: 'background-text-color-replacer',
    name: 'Background & Text Color Replacer',
    category: 'Edit & Annotate',
    badge: 'Color Customization',
    tagline: 'Customize paper tinting and text colors across documents for enhanced readability.',
    plainEnglish:
      'Changes harsh white paper to a warm, gentle sepia or book-paper tone, helping readers read for hours without eye fatigue.',
    underTheHood:
      'Injects background color fill rectangles prior to content stream rendering and modifies default non-stroking color operators (`rg` / `k`) across the graphics state.',
    realWorldUse:
      'Formatting digital books and lengthy reports for improved reading comfort and branded document styling.',
  },
  {
    id: 18,
    slug: 'fill-acroforms',
    name: 'Interactive Form Filler',
    category: 'Edit & Annotate',
    badge: 'Form Handling',
    tagline: 'Fill out interactive government, tax, and corporate form fields directly in the browser.',
    plainEnglish:
      'Lets you click into digital government, tax, or banking forms and type your answers into the boxes cleanly on screen.',
    underTheHood:
      'Parses the `/AcroForm` catalog dictionary, resolves interactive widget annotations (`/Tx`, `/Btn`, `/Ch`), updates field values (`/V`), and regenerates appearance streams (`/AP`) for visual accuracy.',
    realWorldUse:
      'Completing official tax forms (W-9, 1040), employment onboarding documents, and corporate vendor registration forms.',
  },
  {
    id: 19,
    slug: 'flatten-pdf-forms',
    name: 'Flatten PDF Forms',
    category: 'Edit & Annotate',
    badge: 'Integrity Locking',
    tagline: 'Lock interactive form fields into static page content so values cannot be edited.',
    plainEnglish:
      'Permanently locks completed forms. Once filled out, flattening turns text fields into regular non-editable print so nobody can alter your answers.',
    underTheHood:
      'Draws the rendered appearance streams (`/AP`) of all form widgets directly into the parent page Content stream and deletes the interactive `/AcroForm` catalog references.',
    realWorldUse:
      'Archiving signed agreements, approved expense forms, and tax filings to ensure the entered data cannot be changed.',
  },
  {
    id: 20,
    slug: 'stamp-logo-inserter',
    name: 'Stamp & Corporate Seal Inserter',
    category: 'Edit & Annotate',
    badge: 'Official Seals',
    tagline: 'Place high-resolution corporate seals, notary stamps, and approval badges on pages.',
    plainEnglish:
      'Stamps official visual emblems—such as an "APPROVED" seal, a notary stamp, or a certified engineering emblem—onto specific pages.',
    underTheHood:
      'Encodes transparent PNG or SVG graphic assets into PDF Image XObjects and overlays them at specified page coordinates with alpha transparency channels preserved.',
    realWorldUse:
      'Notaries, structural engineers, and compliance officers certifying formal documentation and permit submissions.',
  },
  {
    id: 21,
    slug: 'deskew-scanner-straightener',
    name: 'Auto-Deskew & Scanner Straightener',
    category: 'Edit & Annotate',
    badge: 'Scan Alignment',
    tagline: 'Detect tilted paper scans automatically and rotate them to straight 0° alignment.',
    plainEnglish:
      'Straightens crooked scans. If paper was fed into an office scanner tilted a few degrees, this detects the slant and straightens it automatically.',
    underTheHood:
      'Applies Hough Transform or Radon Transform edge analysis to canvas pixel arrays to compute text line baseline angles, then applies a compensating rotation transform matrix.',
    realWorldUse:
      'Cleaning up crooked paper receipts, fax transmissions, and handwritten forms before archiving or text recognition.',
  },

  // ── GROUP 3: CONVERT TO PDF (22-30) ────────────────────────────────────
  {
    id: 22,
    slug: 'jpg-to-pdf',
    name: 'JPG to PDF',
    category: 'Convert to PDF',
    badge: 'Image Intake',
    tagline: 'Convert camera photos and mobile receipts into clean, standardized PDF documents.',
    plainEnglish:
      'Takes pictures from your phone or camera (like photos of receipts or contracts) and turns them into a standard PDF file.',
    underTheHood:
      'Parses JPEG byte streams, reads EXIF orientation markers, creates matching page dimensions, and writes raw JPEG data into `/DCTDecode` image filters without lossy re-encoding.',
    realWorldUse:
      'Field personnel and business travelers converting phone snapshots of expense receipts into formal reimbursement files.',
  },
  {
    id: 23,
    slug: 'png-to-pdf',
    name: 'PNG to PDF',
    category: 'Convert to PDF',
    badge: 'Lossless Visuals',
    tagline: 'Convert lossless screenshots and design graphics into high-resolution documents.',
    plainEnglish:
      'Turns computer screenshots and graphic designs into a PDF while preserving clean lines, transparent backgrounds, and sharp text.',
    underTheHood:
      'Decompresses PNG deflate streams, splits alpha transparency channels into separate `/SMask` soft-mask image dictionaries, and encodes image streams via `/FlateDecode`.',
    realWorldUse:
      'Designers and software developers compiling UI screenshots and mockups into client design review files.',
  },
  {
    id: 24,
    slug: 'webp-to-pdf',
    name: 'WebP to PDF',
    category: 'Convert to PDF',
    badge: 'Modern Web Formats',
    tagline: 'Import lightweight WebP images into standard print-ready PDF files.',
    plainEnglish:
      'Takes modern WebP images saved from the web and packages them into standard PDFs that can be opened anywhere or printed.',
    underTheHood:
      'Decodes WebP image frames via native browser canvas decoders, extracts raw RGBA buffers, and wraps them into standard PDF image dictionary representations.',
    realWorldUse:
      'Packaging product photos and web assets into downloadable catalogs and line sheets.',
  },
  {
    id: 25,
    slug: 'bmp-to-pdf',
    name: 'BMP to PDF',
    category: 'Convert to PDF',
    badge: 'Legacy Compatibility',
    tagline: 'Convert uncompressed Windows bitmap images into modern compact PDF files.',
    plainEnglish:
      'Takes old, uncompressed Windows bitmap files from older medical or laboratory devices and converts them into modern PDFs.',
    underTheHood:
      'Parses the BITMAPINFOHEADER data structure, extracts uncompressed BGR pixel matrices, and compresses them using Flate algorithms into PDF image objects.',
    realWorldUse:
      'Archiving legacy output from industrial inspection equipment, scientific instruments, and older medical scanners.',
  },
  {
    id: 26,
    slug: 'tiff-to-pdf',
    name: 'TIFF to PDF',
    category: 'Convert to PDF',
    badge: 'Medical & Fax Format',
    tagline: 'Convert multi-page fax transmissions and scanner TIFF files into clean documents.',
    plainEnglish:
      'Converts multi-page fax files (which typically arrive in TIFF format) into standard PDFs viewable on any smartphone or laptop.',
    underTheHood:
      'Parses multi-directory Tagged Image File Format structures (including CCITT Group 4 fax compression), mapping each TIFF directory into an individual PDF page.',
    realWorldUse:
      'Healthcare and legal offices converting incoming electronic faxes into patient charts and case records.',
  },
  {
    id: 27,
    slug: 'text-to-pdf',
    name: 'Text (TXT) to PDF',
    category: 'Convert to PDF',
    badge: 'Text Formatting',
    tagline: 'Convert raw unformatted text and log outputs into styled, paginated documents.',
    plainEnglish:
      'Takes plain notepad text, code outputs, or system notes and turns them into clean, paginated PDF documents with margins and page numbers.',
    underTheHood:
      'Computes character glyph metrics, wraps words at configured margin boundaries, manages pagination breaks across sheets, and writes structured text drawing streams.',
    realWorldUse:
      'Converting server incident logs, plain-text transcripts, and raw notes into formal record attachments.',
  },
  {
    id: 28,
    slug: 'markdown-to-pdf',
    name: 'Markdown to PDF',
    category: 'Convert to PDF',
    badge: 'Developer Docs',
    tagline: 'Parse Markdown headings, lists, code blocks, and diagrams into formatted PDF reports.',
    plainEnglish:
      'Takes Markdown notes (like those from GitHub or Obsidian) and renders them into clean, styled PDF documents with formatted code and tables.',
    underTheHood:
      'Parses Markdown Abstract Syntax Trees (AST), renders syntax-highlighted code blocks, compiles Mermaid diagram code into vector SVG, and formats the output into paginated PDF layouts.',
    realWorldUse:
      'Developers and technical writers exporting documentation, system designs, and release notes into formatted client deliverables.',
  },
  {
    id: 29,
    slug: 'html-to-pdf',
    name: 'HTML to PDF',
    category: 'Convert to PDF',
    badge: 'Web Rendering',
    tagline: 'Convert client-rendered web pages and CSS layouts into printable PDF documents.',
    plainEnglish:
      'Captures web code and turns it into a PDF that matches the website layout, preserving typography, colors, and design styling.',
    underTheHood:
      'Renders HTML and CSS in an offscreen sandboxed browser context, resolves `@media print` layout rules, and compiles DOM elements into PDF vector and image streams.',
    realWorldUse:
      'Saving online receipts, web invoices, and dashboard analytics reports into permanent archival documents.',
  },
  {
    id: 30,
    slug: 'svg-to-pdf',
    name: 'SVG to PDF',
    category: 'Convert to PDF',
    badge: 'Vector Graphics',
    tagline: 'Convert scalable vector graphics into sharp, infinite-resolution vector PDF pages.',
    plainEnglish:
      'Converts vector illustrations, logos, and technical drawings into PDF vector pages so you can zoom in infinitely without pixelation.',
    underTheHood:
      'Parses XML SVG elements (`<path>`, `<rect>`, `<polygon>`) and translates SVG path commands (`M`, `C`, `Z`) directly into PDF vector graphics operators (`m`, `c`, `h`).',
    realWorldUse:
      'Publishing vector logos, architectural schematics, and engineering diagrams without loss of line precision.',
  },

  // ── GROUP 4: CONVERT FROM PDF (31-39) ──────────────────────────────────
  {
    id: 31,
    slug: 'pdf-to-jpg',
    name: 'PDF to JPG',
    category: 'Convert from PDF',
    badge: 'Web Sharing',
    tagline: 'Export document pages as lightweight compressed images for quick sharing and previews.',
    plainEnglish:
      'Turns each page of your PDF into a picture you can easily attach in emails, post on social channels, or drop into presentations.',
    underTheHood:
      'Renders pages at designated DPI using PDF.js onto an offscreen canvas, then calls `canvas.toBlob("image/jpeg")` to generate compressed image streams.',
    realWorldUse:
      'Creating preview images of documents, newsletters, or presentations for social media and website thumbnails.',
  },
  {
    id: 32,
    slug: 'pdf-to-png',
    name: 'PDF to PNG',
    category: 'Convert from PDF',
    badge: 'Lossless Export',
    tagline: 'Export document pages as crisp, lossless high-resolution graphic files.',
    plainEnglish:
      'Converts PDF pages into crystal-clear images without blurry artifacts, keeping fine lines and sharp typography intact.',
    underTheHood:
      'Renders vector streams onto high-resolution canvas buffers (e.g., 300 DPI) and serializes them into uncompressed PNG pixel matrices.',
    realWorldUse:
      'Extracting high-detail charts, tables, and diagrams from research reports to embed in executive slide decks.',
  },
  {
    id: 33,
    slug: 'pdf-to-webp',
    name: 'PDF to WebP',
    category: 'Convert from PDF',
    badge: 'Modern Web Image',
    tagline: 'Export modern lightweight web graphics for fast website loading speeds.',
    plainEnglish:
      'Turns PDF pages into modern WebP pictures that load fast on websites while using significantly less data than traditional image formats.',
    underTheHood:
      'Uses the browser native WebP encoder to compress rendered canvas frame buffers with efficient predictive compression.',
    realWorldUse:
      'Publishing online digital catalogs, product guides, and portfolio samples that load instantly on mobile devices.',
  },
  {
    id: 34,
    slug: 'pdf-to-text',
    name: 'PDF to Text Extractor',
    category: 'Convert from PDF',
    badge: 'Text Processing',
    tagline: 'Extract the raw text stream for search indexing, copy-pasting, and text analysis.',
    plainEnglish:
      'Extracts all readable text out of a PDF into plain words so you can copy and paste them or analyze them without formatting clutter.',
    underTheHood:
      'Extracts character codes from content streams, maps them through ToUnicode CMaps, evaluates horizontal displacement coordinates (`TJ`), and reconstructs word and paragraph flow.',
    realWorldUse:
      'Extracting text from contracts, reports, and manuals for indexing, search systems, or natural language processing.',
  },
  {
    id: 35,
    slug: 'pdf-to-greyscale',
    name: 'PDF to Greyscale / Monochromatic',
    category: 'Convert from PDF',
    badge: 'Print Economy',
    tagline: 'Convert colored pages to pure black-and-white to save printer ink and toner.',
    plainEnglish:
      'Removes all color from a document, turning it into crisp black-and-white so you save expensive color ink when printing.',
    underTheHood:
      'Traverses image and vector color specifications, re-mapping RGB and CMYK color spaces to DeviceGray using standard luminance weighting (`Gray = 0.299R + 0.587G + 0.114B`).',
    realWorldUse:
      'Preparing large multi-page reports for physical printing in corporate environments to minimize toner expenses.',
  },
  {
    id: 36,
    slug: 'pdf-to-markdown',
    name: 'PDF to Markdown',
    category: 'Convert from PDF',
    badge: 'Structured Text',
    tagline: 'Extract text while preserving heading hierarchy (`#`, `##`) for digital notes.',
    plainEnglish:
      'Converts a PDF into structured Markdown notes, turning large bold titles into headers and bullet points into clean lists for Notion or Obsidian.',
    underTheHood:
      'Evaluates font scale and weight distributions to classify structural headings (H1, H2, H3), detects list glyphs, and reconstructs tables using Markdown syntax.',
    realWorldUse:
      'Importing legacy PDF specifications, research articles, and documentation into modern knowledge-base wikis.',
  },
  {
    id: 37,
    slug: 'pdf-to-html',
    name: 'PDF to HTML',
    category: 'Convert from PDF',
    badge: 'Web Document',
    tagline: 'Transform PDF pages into readable, responsive web markup.',
    plainEnglish:
      'Turns a PDF document into a web page that anyone can read in their browser without downloading a file.',
    underTheHood:
      'Extracts text blocks and styling rules, positioning elements via CSS layouts or semantic HTML structure (`<p>`, `<h1>`, `<table>`) with embedded assets.',
    realWorldUse:
      'Publishing public notices, research findings, and company updates directly onto websites for accessible reading.',
  },
  {
    id: 38,
    slug: 'pdf-to-svg',
    name: 'PDF to SVG',
    category: 'Convert from PDF',
    badge: 'Vector Recovery',
    tagline: 'Extract vector drawings and schematics back into scalable vector paths.',
    plainEnglish:
      'Pulls vector drawings and graphics out of a PDF so you can open and edit them in design programs like Illustrator or Figma.',
    underTheHood:
      'Translates PDF vector drawing commands into corresponding SVG XML nodes (`<path>`, `<polygon>`, `<text>`) while maintaining precise coordinate paths.',
    realWorldUse:
      'Extracting logos, technical schematics, and vector illustrations from PDFs for further editing in design applications.',
  },
  {
    id: 39,
    slug: 'ocr-pdf-searchable',
    name: 'Client-Side OCR (Searchable PDF)',
    category: 'Convert from PDF',
    badge: 'Optical Character Recognition',
    tagline: 'Apply WebAssembly Tesseract OCR to convert scanned images into selectable, searchable text.',
    plainEnglish:
      'Takes a photo or scan of a document where you cannot highlight words, reads the letters with machine learning, and embeds an invisible text layer so you can search (Ctrl+F) and copy words.',
    underTheHood:
      'Executes Tesseract.js compiled into WebAssembly inside a Web Worker. It analyzes pixel matrices, identifies character bounding boxes using LSTM neural models, and synthesizes a transparent text overlay aligned directly with the scanned page.',
    realWorldUse:
      'Making scanned historical records, paper contracts, and medical intake forms fully searchable without uploading files to external servers.',
  },

  // ── GROUP 5: SECURITY, OPTIMIZATION & COMPLIANCE (40-51) ───────────────
  {
    id: 40,
    slug: 'compress-pdf',
    name: 'Smart PDF Compressor',
    category: 'Security & Compliance',
    badge: 'File Optimization',
    tagline: 'Optimize image resolution and stream encoding to reduce document file sizes locally.',
    plainEnglish:
      'Shrinks large PDF file sizes so they are easier to email and upload, without noticeably degrading text or image quality.',
    underTheHood:
      'Re-samples embedded image XObjects to lower resolution targets (e.g. 150 DPI), strips redundant font subsets, and applies Flate compression across stream dictionaries.',
    realWorldUse:
      'Reducing the size of resumes, portfolio packets, and business proposals so they fit within email and application portal size limits.',
  },
  {
    id: 41,
    slug: 'hyper-compress',
    name: 'Hyper Compress',
    category: 'Security & Compliance',
    badge: 'Aggressive Reduction',
    tagline: 'Aggressive stream optimization engineered to fit strict file size portal limits.',
    plainEnglish:
      'Applies maximum compression to shrink oversized files down to meet strict size limits enforced by upload portals (such as 20MB caps).',
    underTheHood:
      'Downsamples images to 96 DPI, converts CMYK imagery to RGB, strips color profiles, discards embedded thumbnail caches, and linearizes data streams.',
    realWorldUse:
      'Squeezing heavy photo-heavy insurance claims and inspection reports under strict carrier portal upload ceilings.',
  },
  {
    id: 42,
    slug: 'repair-pdf',
    name: 'PDF Repair & Stream Rebuilder',
    category: 'Security & Compliance',
    badge: 'File Recovery',
    tagline: 'Rebuild damaged cross-reference tables and corrupt stream headers.',
    plainEnglish:
      'Repairs broken PDF files that fail to open. It scans through the raw file data and reconstructs damaged structural indexes so the document can open again.',
    underTheHood:
      'Scans raw bytes to locate `obj` and `endobj` markers when the `/XRef` table is missing or corrupt, rebuilding the object index from scratch and generating a clean trailer dictionary.',
    realWorldUse:
      'Recovering partially downloaded documents or files salvaged from corrupted storage drives.',
  },
  {
    id: 43,
    slug: 'encrypt-password-protect',
    name: 'Password Encryption (AES-256)',
    category: 'Security & Compliance',
    badge: 'Access Control',
    tagline: 'Secure documents with industry-standard 128-bit or 256-bit AES encryption.',
    plainEnglish:
      'Puts a digital lock on your document. Anyone who tries to open it must enter the password, or they cannot view any content.',
    underTheHood:
      'Derives an encryption key from user and owner passwords using PBKDF2/SHA-256 algorithms, initializes an AES cipher in CBC mode, and encrypts all content streams while configuring the `/Encrypt` trailer dictionary.',
    realWorldUse:
      'Protecting confidential salary statements, financial filings, and medical evaluations sent via email.',
  },
  {
    id: 44,
    slug: 'decrypt-remove-password',
    name: 'Password Decryption & Removal',
    category: 'Security & Compliance',
    badge: 'Credential Clearance',
    tagline: 'Remove password restrictions from authorized documents locally.',
    plainEnglish:
      'Removes the password from a PDF you already have permission to access, so you don\'t have to keep re-typing the password every time you open it.',
    underTheHood:
      'Verifies the supplied password against document authentication hashes, decrypts stream buffers in memory, and writes an unencrypted PDF file with the `/Encrypt` dictionary removed.',
    realWorldUse:
      'Removing repetitive password prompts from authorized bank records or utility statements prior to batch filing.',
  },
  {
    id: 45,
    slug: 'change-permissions',
    name: 'Document Permission Manager',
    category: 'Security & Compliance',
    badge: 'Usage Rights',
    tagline: 'Configure user permissions to restrict printing, text copying, or content editing.',
    plainEnglish:
      'Allows people to view your document, but prevents them from printing it out, copying the text, or altering the file.',
    underTheHood:
      'Configures the 32-bit permissions bitmask in the `/P` entry of the `/Encrypt` dictionary, toggling flags for printing, modifying content, copying text, and adding annotations.',
    realWorldUse:
      'Sharing confidential proposals or creative previews while preventing unauthorized text copying or printing.',
  },
  {
    id: 46,
    slug: 'digital-sign-pdf',
    name: 'Digital Signature & Stamp',
    category: 'Security & Compliance',
    badge: 'Electronic Signatures',
    tagline: 'Apply visual or cryptographically backed electronic signatures directly onto agreements.',
    plainEnglish:
      'Sign documents right on your screen with your mouse or touchpad, without printing, signing on paper, and scanning back in.',
    underTheHood:
      'Applies visual signature markings onto pages as `/Widget` annotations and can calculate byte-range hashes to verify document integrity after signing.',
    realWorldUse:
      'Executing consulting agreements, work orders, and approval forms quickly without paper handling.',
  },
  {
    id: 47,
    slug: 'redact-content-pii',
    name: 'True Vector Redaction',
    category: 'Security & Compliance',
    badge: 'Data Sanitization',
    tagline: 'Permanently remove sensitive text tokens and confidential data beneath redaction boxes.',
    plainEnglish:
      'Draws black boxes over sensitive information (like Social Security numbers or credit cards) and permanently erases the words underneath so nobody can copy and paste them.',
    underTheHood:
      'Identifies text character operators overlapping the redaction bounding box, deletes those character tokens from the content stream, and draws a solid black rectangle over the visual coordinates.',
    realWorldUse:
      'Redacting personal identifiers, account numbers, and confidential details before filing evidence on public court dockets.',
  },
  {
    id: 48,
    slug: 'edit-metadata',
    name: 'Document Metadata Editor',
    category: 'Security & Compliance',
    badge: 'Metadata Management',
    tagline: 'Inspect and edit document Title, Author, Subject, Keywords, and Creator properties.',
    plainEnglish:
      'Updates the internal information tags of a PDF—such as the document title, author name, and search keywords.',
    underTheHood:
      'Modifies attributes in the `/Info` dictionary (`/Title`, `/Author`, `/Subject`, `/Keywords`) and synchronizes changes with the embedded Extensible Metadata Platform (XMP) stream.',
    realWorldUse:
      'Ensuring research reports and public whitepapers have accurate title and author information for search engines and archives.',
  },
  {
    id: 49,
    slug: 'remove-strip-metadata',
    name: 'Metadata Exorcist & Sanitizer',
    category: 'Security & Compliance',
    badge: 'Privacy Scrubbing',
    tagline: 'Strip hidden revision histories, device usernames, GPS coordinates, and printer identifiers.',
    plainEnglish:
      'Erases hidden tracking data inside a PDF. When you save a file, it can store your computer username and revision history; this tool wipes all of that clean.',
    underTheHood:
      'Deletes the `/Info` dictionary and `/Metadata` XMP streams, clears creation timestamps, and normalizes object IDs to eliminate operational fingerprinting.',
    realWorldUse:
      'Sanitizing documents before public release to protect source identity and remove internal system details.',
  },
  {
    id: 50,
    slug: 'sanitize-disarm-pdf',
    name: 'Malicious Object Disarmer',
    category: 'Security & Compliance',
    badge: 'Security Defense',
    tagline: 'Strip executable `/JavaScript`, `/Launch` commands, and tracking payloads from files.',
    plainEnglish:
      'Cleans risky PDFs received from unknown senders by stripping hidden scripts and executable actions so the document can be opened safely.',
    underTheHood:
      'Parses the PDF object tree, locates and removes all `/JavaScript`, `/JS`, `/Launch`, `/EmbeddedFiles`, and `/SubmitForm` dictionary entries, and neutralizes automated actions.',
    realWorldUse:
      'Safely opening unsolicited documents, job applicant attachments, and broker proposals without malware risks.',
  },
  {
    id: 51,
    slug: 'compare-diff-pdf',
    name: 'PDF Redline & Visual Diff Engine',
    category: 'Security & Compliance',
    badge: 'Version Comparison',
    tagline: 'Compare two PDF revisions side-by-side to highlight text additions and deletions.',
    plainEnglish:
      'Compares two versions of a document and highlights exactly what changed—marking new text in green and deleted text in red.',
    underTheHood:
      'Extracts text streams from both document versions, tokenizes content into words and sentences, executes text comparison algorithms to align paragraphs, and renders a synchronized comparison view.',
    realWorldUse:
      'Comparing contract revisions to quickly identify un-flagged clause edits or wording alterations between drafts.',
  },
];

export const BENTO_FAQS: BentoFaq[] = [
  {
    question: 'What is BentoPDF and how does it work?',
    answer:
      'BentoPDF is an open-source, privacy-first PDF toolkit created by Alam Abdullah. Unlike conventional online PDF services that upload your files to remote cloud servers to process them, BentoPDF executes document manipulation directly in your web browser memory using compiled WebAssembly (WASM) libraries (such as MuPDF, Tesseract.js, and pdf-lib). Documents never leave your local environment during core processing.',
  },
  {
    question: 'How does client-side WebAssembly processing ensure data privacy?',
    answer:
      'Because file processing occurs locally inside your browser sandbox, your documents are never transmitted over the internet or saved to an external database. This architecture eliminates data exposure risks and complies with strict data protection guidelines (including HIPAA and GDPR) by ensuring zero remote data retention.',
  },
  {
    question: 'What is the difference between the bentopdf and bentopdf-simple Docker images?',
    answer:
      'The repository provides two container variants on GitHub Container Registry. The standard `bentopdf` image contains the full public web presentation. The `bentopdf-simple` image (ghcr.io/alam00000/bentopdf-simple) is a streamlined build designed specifically for local home servers, personal lab setups, and self-hosted environments that provides direct access to the 50+ utility tools without marketing pages.',
  },
  {
    question: 'Does BentoPDF work offline without an active internet connection?',
    answer:
      'Yes. Once the initial application bundle or Docker container is loaded, all WebAssembly binaries and processing dependencies are stored locally. The application can run entirely in airplane mode or in disconnected air-gapped environments without any network connection.',
  },
  {
    question: 'How does BentoPDF perform Optical Character Recognition (OCR) locally?',
    answer:
      'BentoPDF utilizes Tesseract.js compiled into WebAssembly. When processing a scanned document, a background Web Worker runs the neural recognition model directly on the client machine CPU, extracting character coordinates and embedding a selectable text layer directly over the original page layout.',
  },
  {
    question: 'What open-source license does BentoPDF use?',
    answer:
      'BentoPDF is published under the GNU Affero General Public License v3.0 (AGPL-3.0) for open-source use, with dual-licensing commercial options available from the author for closed-source or enterprise deployments.',
  },
];

export interface BentoBlueprintIdea {
  id: 'claimpack' | 'bentobid' | 'difflegal' | 'untrusted-pdf';
  name: string;
  badge: string;
  tagline: string;
  niche: string;
  pricing: string;
  targetMrr: string;
  customersNeeded: string;
  timeToMvp: string;
  market: {
    target: string;
    description: string;
    sizeAndSpend: string;
  };
  problem: {
    corePain: string;
    incumbentFlaws: string[];
    riskOfDoingNothing: string;
  };
  product: {
    name: string;
    summary: string;
    keyFeatures: Array<{ title: string; description: string }>;
  };
  customer: {
    title: string;
    budgetAuthority: string;
    triggerMoment: string;
  };
  trafficAcquisition: Array<{
    channel: string;
    strategy: string;
  }>;
  searchDemand: {
    totalSearches: string;
    keywords: Array<{ query: string; volume: string; cpc: string; kd: number }>;
  };
  technicalDelta: {
    modulesToKeep: string[];
    whatToBuild: string[];
    architectureNote: string;
  };
}

export const BENTO_BLUEPRINTS: BentoBlueprintIdea[] = [
  {
    id: 'claimpack',
    name: 'ClaimPack',
    badge: 'Insurance Tech',
    tagline: 'Carrier-Ready Damage Proof & Photo Log Packager Under 20MB',
    niche: 'Public Insurance Adjusters & Appraisers',
    pricing: '$89 / mo (Solo) — $199 / mo (Firm)',
    targetMrr: '$10,000 / mo',
    customersNeeded: '80 – 110 Adjusters',
    timeToMvp: '3 – 5 Days',
    market: {
      target: 'Independent Public Insurance Adjusters & Property Casualty Damage Appraisers',
      description:
        'Licensed adjusters hired by homeowners and commercial property owners to negotiate property loss claims against major insurers (State Farm, Allstate, Liberty Mutual).',
      sizeAndSpend:
        'Over 35,000 licensed public and independent adjusters in the US alone. Adjusters earn 10%–15% contingency fees on $50k–$500k claims and spend heavily on field tools.',
    },
    problem: {
      corePain:
        'Insurance company claim portals strictly reject any PDF upload larger than 20MB or 25MB. An adjuster\'s inspection log contains 80–150 high-res camera photos (250MB+) of roof, hail, and flood damage.',
      incumbentFlaws: [
        'Adjusters manually insert photos into Word tables, type captions, export to PDF, and battle generic web compressors that turn damage photos into blurry unreadable mush.',
        'If carrier reviewers cannot inspect shingle fractures due to poor compression, they reject the claim or delay review by 30 days.',
        'Cloud PDF upload services take 15 minutes to process 250MB and risk client property address privacy.',
      ],
      riskOfDoingNothing:
        'Carrier review delays pushing payout collections back by months, hurting cash flow on contingency fees.',
    },
    product: {
      name: 'ClaimPack Pro',
      summary:
        'A browser-based claim packager running entirely in local memory that converts raw photo folders into carrier-compliant 4-up photo grids and auto-compresses packets to precisely 19.4MB.',
      keyFeatures: [
        {
          title: 'Smart 4-Up Damage Photo Grid',
          description:
            'Drag in 100 raw iPhone photos. It auto-aligns them into standardized 2x2 or 3x2 inspection sheets with room headers, damage description fields, and camera timestamp stamps.',
        },
        {
          title: 'Target-Size Carrier Compressor',
          description:
            'A single preset dial ("Fit Under 20MB for Carrier Portal"). Uses BentoPDF\'s client-side image downsampling to compress exactly to 19.4MB without losing crucial crack/damage clarity.',
        },
        {
          title: 'Proof-of-Loss Master Binder',
          description:
            'Merges contractor estimates, Xactimate printouts, engineer affidavits, and policy pages into one unified, bookmarked carrier dossier.',
        },
      ],
    },
    customer: {
      title: 'Principal Public Adjuster / Senior Claims Estimator',
      budgetAuthority:
        'Firm corporate credit card with $200/mo discretionary tool budget. Wins $15,000 fees per claim, making $89/mo negligible.',
      triggerMoment:
        'At 4:45 PM on Friday when the carrier portal rejects a 26MB roof damage PDF upload, blocking submission before the weekend deadline.',
    },
    trafficAcquisition: [
      {
        channel: 'NAPIA & State Adjuster Associations (FAPIA in Florida, TAPIA in Texas)',
        strategy:
          'Sponsor local chapter newsletters and educational webinars demonstrating "How to eliminate carrier portal upload rejections."',
      },
      {
        channel: 'Xactimate & Adjuster Communities',
        strategy:
          'Engage in private Facebook groups and forums ("Public Adjuster Network" with 18k+ members) sharing pre-built claim grid templates.',
      },
      {
        channel: 'Direct Cold Email to Licensed State Directories',
        strategy:
          'State insurance commissioner websites publish lists of all active public adjuster license holders with business emails.',
      },
    ],
    searchDemand: {
      totalSearches: '32,000+ monthly searches across insurance claim formatting and photo compression',
      keywords: [
        { query: 'compress pdf under 20mb', volume: '14,800', cpc: '$4.20', kd: 31 },
        { query: 'insurance claim photo sheet template', volume: '2,400', cpc: '$6.50', kd: 19 },
        { query: 'proof of loss pdf binder', volume: '1,200', cpc: '$8.10', kd: 14 },
        { query: 'xactimate pdf combiner', volume: '950', cpc: '$5.40', kd: 12 },
      ],
    },
    technicalDelta: {
      modulesToKeep: [
        'Image-to-PDF engine (Tool #22-24)',
        'Smart PDF Compressor (Tool #40)',
        'Hyper Compress (Tool #41)',
        'Merge PDFs (Tool #1)',
      ],
      whatToBuild: [
        '2x2 and 3x2 photo sheet canvas generator with caption input fields',
        'Carrier preset slider (State Farm 20MB, Liberty Mutual 25MB)',
        'EXIF photo date/GPS coordinate extractor and watermarker',
      ],
      architectureNote:
        'All photo resizing and grid rendering occurs in browser Web Workers. Zero server compute costs even when processing 500MB of camera RAW/JPEG photos.',
    },
  },
  {
    id: 'bentobid',
    name: 'BentoBid',
    badge: 'Construction Tech',
    tagline: '3-Second Commercial Blueprint Plan Set Extractor for Subcontractors',
    niche: 'Commercial Trade Subcontractors (Electrical, HVAC, Plumbing)',
    pricing: '$99 / mo (5 Estimator Licenses)',
    targetMrr: '$10,000 / mo',
    customersNeeded: '101 Subcontractor Companies',
    timeToMvp: '3 – 4 Days',
    market: {
      target: 'Commercial Trade Subcontractors (Electrical, Mechanical, Plumbing, Drywall)',
      description:
        'Subcontractor firms with 10–60 employees bidding on $100k–$3M trade packages on commercial building projects.',
      sizeAndSpend:
        'Over 200,000 specialty trade contracting firms in the US. Estimating teams bid 15–30 projects monthly and rely on rapid plan review.',
    },
    problem: {
      corePain:
        'General Contractors send 400-page, 300MB+ architectural blueprint PDFs. An electrical sub only needs the 14 electrical pages (E-101 to E-114) to send to distributors for material pricing.',
      incumbentFlaws: [
        'Standard online PDF splitters choke and crash when uploading 300MB CAD files.',
        'Cloud tools take 10 minutes to upload and download heavy architectural drawings over standard office connections.',
        'Bluebeam Revu costs $240–$400/seat/year and is overly bloated for a quick trade scope extraction.',
      ],
      riskOfDoingNothing:
        'Estimators waste 1–2 hours per bid manually printing or hunting pages, or accidentally email 400MB general files to suppliers, causing email bounces.',
    },
    product: {
      name: 'BentoBid',
      summary:
        'A browser-local blueprint extractor that opens 300MB plan sets in 2 seconds in RAM, auto-detects sheet index numbers, and splits clean trade bid packages with 1 click.',
      keyFeatures: [
        {
          title: 'Instant 300MB Local Plan Loading',
          description:
            'Because BentoPDF runs client-side via MuPDF WASM, giant architectural drawing sets open instantly with zero cloud upload waiting time.',
        },
        {
          title: 'Sheet Code Scope Extractor',
          description:
            'Auto-scans sheet numbers in the bottom-right title block (`E-` for Electrical, `M-` for Mechanical, `P-` for Plumbing) and isolates trade packages automatically.',
        },
        {
          title: 'Vendor RFQ Watermarking & Cover Stamp',
          description:
            'Stamps company logo, "For Bid Only - Trade Scope", and return bid dates across extracted sheets before emailing material suppliers.',
        },
      ],
    },
    customer: {
      title: 'Chief Estimator / Pre-Construction Project Manager',
      budgetAuthority:
        'Department software card with $150/mo limit. A single won commercial bid pays $40,000+ profit.',
      triggerMoment:
        'Opening a 450-page BuildingConnected tender invite on a tight 48-hour bid deadline and watching their PDF reader freeze.',
    },
    trafficAcquisition: [
      {
        channel: 'BuildingConnected & Procore Subcontractor Forums',
        strategy:
          'Position as "The 2-second plan set splitter for BuildingConnected bid invites."',
      },
      {
        channel: 'LinkedIn Outreach to Chief Estimators',
        strategy:
          'Send a 15-second screen recording showing a 300MB architectural plan set opened and split into electrical sheets in 3 seconds flat.',
      },
      {
        channel: 'Trade Associations (NECA for Electrical, MCAA for Mechanical)',
        strategy:
          'Sponsor trade chapter tech tool spotlights and practical estimating workflow guides.',
      },
    ],
    searchDemand: {
      totalSearches: '18,500+ monthly searches for blueprint splitting and plan set management',
      keywords: [
        { query: 'split large blueprint pdf', volume: '4,600', cpc: '$5.80', kd: 22 },
        { query: 'extract pages from large pdf', volume: '8,200', cpc: '$3.90', kd: 28 },
        { query: 'bluebeam alternative plan splitter', volume: '1,800', cpc: '$9.40', kd: 17 },
        { query: 'construction plan set separator', volume: '850', cpc: '$7.20', kd: 11 },
      ],
    },
    technicalDelta: {
      modulesToKeep: [
        'Split PDFs (Tool #2)',
        'Extract Pages (Tool #4)',
        'Watermark Engine (Tool #13)',
        'Crop PDF Margins (Tool #15)',
      ],
      whatToBuild: [
        'Title block OCR regex scanner looking for standard architectural prefixes (`A-`, `S-`, `M-`, `E-`, `P-`)',
        'Batch range selector with comma and hyphen parsing (`E1-E14, G-001`)',
        'Subcontractor branding and vendor RFQ cover page stamper',
      ],
      architectureNote:
        'Uses MuPDF WASM memory pointers for zero-copy page extraction, enabling 300MB CAD plan splits in under 3 seconds on standard laptops.',
    },
  },
  {
    id: 'difflegal',
    name: 'DiffLegal',
    badge: 'Legal Tech',
    tagline: 'Zero-Cloud Contract Redline & Document Diff Comparator',
    niche: 'In-House Legal Teams & Contracts Managers',
    pricing: '$99 / mo (Solo / Team) — $179 / mo (Power Legal Ops)',
    targetMrr: '$10,000 / mo',
    customersNeeded: '75 – 100 Companies',
    timeToMvp: '3 – 5 Days',
    market: {
      target: 'In-House Legal Operations, Contracts Managers & General Counsel at Mid-Market Tech/B2B Firms (100–1,000 employees)',
      description:
        'Corporate legal teams reviewing 30–60 vendor and customer agreements per month without enterprise-sized 20-person legal departments.',
      sizeAndSpend:
        'Over 80,000 mid-market companies in the US. Legal ops teams have corporate credit cards with $100–$250/mo limits for drafting productivity tools.',
    },
    problem: {
      corePain:
        'Counterparties frequently return signed or reviewed contracts as flattened/scanned PDFs with un-flagged clause edits ("Stealth Edits") that Word cannot compare.',
      incumbentFlaws: [
        'Litera Compare killed off Workshare Compare on Dec 31, 2023, forcing teams into multi-thousand-dollar enterprise sales quotes.',
        'Adobe Acrobat Compare generates hundreds of false positives on page headers, margins, and font kerning.',
        'Enterprise CLM software (Ironclad, SpotDraft) costs $15,000+/yr and takes 6 months of IT procurement.',
      ],
      riskOfDoingNothing:
        'Missing a stealth edit that alters a liability cap from $5,000,000 to $50,000 or deletes a crucial indemnity clause, creating catastrophic liability.',
    },
    product: {
      name: 'DiffLegal',
      summary:
        'An in-browser, zero-cloud PDF and Word redline comparator that extracts text locally, aligns clauses, suppresses formatting noise, and exports standard redline reports.',
      keyFeatures: [
        {
          title: 'Zero-Cloud Confidentiality Guarantee',
          description:
            'Runs 100% in browser RAM via WebAssembly. Un-signed MSAs, NDAs, and customer pricing never transmit to an external server or AI API.',
        },
        {
          title: 'Noise-Cancelling Clause Alignment',
          description:
            'Automatically ignores page breaks, running headers, footers, and font kerning shifts—highlighting only substantive legal text modifications.',
        },
        {
          title: '1-Click Redline & Change Memo Export',
          description:
            'Exports both a standard color-coded redline PDF and an executive bulleted change summary ready to paste into Slack or email.',
        },
      ],
    },
    customer: {
      title: 'Senior Contracts Manager / Legal Operations Director',
      budgetAuthority:
        'Discretionary corporate expense limit of $150–$200/mo requiring zero CFO approval.',
      triggerMoment:
        'During end-of-quarter sales close when an enterprise customer returns a 50-page vendor agreement with untracked PDF edits.',
    },
    trafficAcquisition: [
      {
        channel: 'CLOC (Corporate Legal Operations Consortium) & Legal Operators Slack',
        strategy:
          'Share practical comparisons demonstrating how standard comparison tools fail on flattened PDFs with zero-cloud demos.',
      },
      {
        channel: 'Free "Stealth Redline Checker" Tool',
        strategy:
          'Free 5-page public comparison tool that indexes for "workshare compare alternative" and gates 50-page agreements behind the $99/mo plan.',
      },
      {
        channel: 'Targeted LinkedIn Outreach to Contracts Managers',
        strategy:
          'Direct message with a 20-second screen recording showing a 50-page contract compared in 4 seconds offline.',
      },
    ],
    searchDemand: {
      totalSearches: '140,000+ monthly searches for PDF diffing and legal contract comparison',
      keywords: [
        { query: 'compare pdf files', volume: '110,000', cpc: '$3.80', kd: 65 },
        { query: 'diff pdf', volume: '18,500', cpc: '$4.10', kd: 38 },
        { query: 'contract comparison software', volume: '2,400', cpc: '$22.50', kd: 42 },
        { query: 'workshare compare alternative', volume: '1,800', cpc: '$14.20', kd: 19 },
      ],
    },
    technicalDelta: {
      modulesToKeep: [
        'PDF Redline & Visual Diff Engine (Tool #51)',
        'PDF to Text Extractor (Tool #34)',
        'Client-Side OCR (Tool #39)',
      ],
      whatToBuild: [
        'Sentence-level Myers/Patience tokenization diff algorithm',
        'Running header/footer noise suppression filter',
        'Side-by-side synchronized canvas scrolling viewer with additions (green) and deletions (red)',
      ],
      architectureNote:
        'Combines MuPDF WASM text coordinates with client-side diff alignment, guaranteeing that confidential contract drafts never touch an external server.',
    },
  },
  {
    id: 'untrusted-pdf',
    name: 'Untrusted PDF',
    badge: 'Cybersecurity Gateway',
    tagline: 'Surgical Content Disarm & Reconstruction (CDR) Gateway for Inbound PDFs',
    niche: 'Boutique Family Offices, M&A Deal Teams & Wealth Managers',
    pricing: '$149 / mo (Office) — $299 / mo (Enterprise Gateway)',
    targetMrr: '$10,000 / mo',
    customersNeeded: '50 – 70 Firms',
    timeToMvp: '2 – 3 Days',
    market: {
      target: 'Boutique Family Offices, Private Equity M&A Teams & High-End Recruiting Agencies ($20M–$500M AUM)',
      description:
        'Financial and executive teams receiving hundreds of unsolicited investment pitch decks, private placement memos, and resume attachments from unvetted third parties.',
      sizeAndSpend:
        'Over 10,000 family offices and boutique private equity firms globally. Cybersecurity is a top board-level mandate; $150–$300/mo is negligible compared to wire-fraud risks.',
    },
    problem: {
      corePain:
        'Opening an inbound PDF from a stranger is an active security risk. PDFs can carry embedded JavaScript, `/Launch` execution payloads, and malicious tracking beacons targeting wealth managers.',
      incumbentFlaws: [
        'Enterprise CDR software (OPSWAT, Menlo, Votiro) costs $25,000–$100,000/year and requires dedicated 20-person IT teams.',
        'Open-source Dangerzone is clunky, takes 5 minutes per file, destroys vector sharpness, and requires non-technical staff to install Docker.',
        'Telling deal associates to "not open attachments from strangers" is impossible when their job is vetting incoming investment proposals.',
      ],
      riskOfDoingNothing:
        'A single compromised executive laptop leading to ransomware, stolen deal memos, or intercepted wire transfer instructions.',
    },
    product: {
      name: 'SanitizePDF Pro',
      summary:
        'A browser-local or Docker-intake appliance that performs surgical Content Disarm and Reconstruction (CDR), stripping all executable code while keeping vector text and layout 100% crisp.',
      keyFeatures: [
        {
          title: 'Surgical Object Disarmer',
          description:
            'Parses the PDF DOM and deletes all `/JavaScript`, `/JS`, `/Launch`, `/EmbeddedFiles`, and `/SubmitForm` dictionary entries in under 2 seconds.',
        },
        {
          title: 'Vector-Preserving Document Integrity',
          description:
            'Unlike Dangerzone which flattens files into blurry pixel images, SanitizePDF preserves 100% of the original vector sharpness, selectable fonts, and clean layout.',
        },
        {
          title: 'Threat Disarm Certificate',
          description:
            'Automatically displays an audit receipt verifying which hidden scripts, tracking beacons, or launch actions were neutralized.',
        },
      ],
    },
    customer: {
      title: 'Managing Director / Chief Operating Officer at a Family Office',
      budgetAuthority:
        'Manages multi-million dollar funds; approving $149/mo on a corporate card for document security requires zero red tape.',
      triggerMoment:
        'A cybersecurity audit warning the firm that investment associates are opening unvetted broker pitch decks directly on corporate MacBooks.',
    },
    trafficAcquisition: [
      {
        channel: 'Partnerships with Wealth-Focused MSPs & Virtual CISOs',
        strategy:
          'Offer Managed Service Providers (MSPs) a 30% recurring margin to include SanitizePDF in their standard cybersecurity stack for wealth managers.',
      },
      {
        channel: 'Free "Hostile PDF Health Check" Tool',
        strategy:
          'A free public page allowing users to inspect hidden PDF objects, showing tracking beacons and script payloads in sample documents.',
      },
      {
        channel: 'Targeted LinkedIn Outreach to Family Office Operations',
        strategy:
          'Message COOs and Operations Directors: "How does your deal team vet incoming broker pitch decks before opening them on corporate laptops?"',
      },
    ],
    searchDemand: {
      totalSearches: '26,000+ monthly searches for PDF security, virus scanning, and safe document opening',
      keywords: [
        { query: 'safe pdf viewer', volume: '9,800', cpc: '$3.10', kd: 35 },
        { query: 'remove javascript from pdf', volume: '3,200', cpc: '$4.80', kd: 18 },
        { query: 'content disarm and reconstruction', volume: '2,900', cpc: '$18.20', kd: 44 },
        { query: 'clean malicious pdf', volume: '1,400', cpc: '$7.50', kd: 16 },
      ],
    },
    technicalDelta: {
      modulesToKeep: [
        'Malicious Object Disarm & Sanitizer (Tool #50)',
        'Metadata Exorcist & Sanitizer (Tool #49)',
        'Document Permission Manager (Tool #45)',
      ],
      whatToBuild: [
        'PDF dictionary object purifier stripping `/JS`, `/JavaScript`, `/Launch`, `/EmbeddedFiles`, `/GoToE`',
        'Hyperlink defanger rewriting `/URI` actions with secure warning interstitials',
        'Inspection audit certificate generator showing neutralized threat objects',
      ],
      architectureNote:
        'Executes via MuPDF in local WebAssembly or a hardened offline Docker container with zero outbound network access permitted.',
    },
  },
];

