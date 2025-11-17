# Design Guidelines: Article CMS Admin Panel

## Design Approach

**Selected Approach:** Design System (Utility-Focused)

**Inspiration Sources:** Linear's clean productivity interface, Notion's content-first editing experience, and modern SaaS admin panels

**Core Principles:**
- Clarity over decoration: Every element serves a functional purpose
- Content-first hierarchy: The article editor is the hero of this application
- Efficient workflows: Minimize clicks and cognitive load for common tasks
- Scannable layouts: Quick information access through clear visual hierarchy

---

## Typography System

**Font Family:** Inter (primary), JetBrains Mono (code blocks in editor)

**Hierarchy:**
- Page Titles: text-3xl, font-semibold (Dashboard, Article Editor)
- Section Headers: text-xl, font-semibold (Settings sections, Table headers)
- Card/Component Titles: text-lg, font-medium (Article titles in list)
- Body Text: text-base, font-normal (Form labels, descriptions)
- Helper Text: text-sm, font-normal (Validation messages, metadata)
- Caption/Meta: text-xs, font-medium (Timestamps, counts)

**Special Typography:**
- Editor content area: text-lg for comfortable reading/writing
- Code blocks within editor: font-mono, text-sm
- Article preview text: text-sm with line-clamp-2 for truncation

---

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, and 8
- Micro spacing (between related elements): p-2, gap-2
- Component padding: p-4, p-6
- Section spacing: py-8, mb-8
- Page-level margins: p-8 on desktop, p-4 on mobile

**Container Strategy:**
- Admin shell: Full-width with sidebar navigation (w-64 fixed sidebar)
- Main content area: max-w-7xl mx-auto with px-8 for breathing room
- Editor view: max-w-4xl mx-auto (optimal reading/writing width)
- Settings forms: max-w-2xl mx-auto

**Grid Layouts:**
- Dashboard article table: Single column responsive table
- Settings page: 2-column form layout (label | input) on desktop, stack on mobile
- Article metadata bar: Flex row with space-between for editor actions

---

## Component Library

### Navigation & Shell

**Sidebar Navigation (Fixed Left):**
- Width: w-64
- Structure: Logo at top, nav links as vertical list with icons
- Items: Dashboard, Categories, Comments, Settings
- Active state: Highlight with subtle background treatment
- Icon size: w-5 h-5 inline with text-sm labels
- Spacing: py-2 per item, px-4 horizontal padding

**Top Bar (Article Editor only):**
- Full-width sticky header
- Left: Back button + Article title (editable inline)
- Right: Save button + Publish toggle
- Height: h-16 with border-b separator

### Dashboard Components

**Article Table:**
- Full-width responsive table with hover states on rows
- Columns: Cover thumbnail (w-16 rounded), Title (flex-1), Category (w-32), Created Date (w-40), Likes (w-20 text-center)
- Row height: h-20 for comfortable clicking
- Action menu: Right-aligned three-dot menu per row
- Empty state: Centered illustration + "Create your first article" CTA

**Stats Cards (Above table):**
- Grid of 4 cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-4
- Each card: p-6, rounded-lg border
- Content: Large number (text-3xl font-bold) + label (text-sm)
- Stats: Total Articles, Published, Draft, Total Likes

### Article Editor Components

**Cover Image Upload:**
- Drag-and-drop zone: aspect-video ratio, rounded-lg border-dashed
- Preview mode: Full-width image with "Change Cover" button overlay on hover
- Upload state: Loading spinner with progress indicator
- Dimensions guideline: "Recommended: 1200x630px" as helper text below

**Rich Text Editor:**
- Toolbar: Sticky top position below header, border-b separator
- Toolbar layout: Flex row with gap-1, grouped by function with gap-4 between groups
- Button size: w-8 h-8 for toolbar icons
- Editor content: Generous padding (p-12), prose max-w-none for optimal writing experience
- Image in content: max-w-full rounded-lg with my-4 spacing
- Minimum height: min-h-screen for immersive writing

**Toolbar Groups:**
1. Text formatting: Bold, Italic, Underline, Code
2. Structure: H1, H2, H3, Bullet List, Numbered List
3. Insert: Link, Image Upload, Code Block
4. Layout: Blockquote, Horizontal Rule

**Metadata Sidebar (Right rail on wide screens, collapsible):**
- Width: w-80
- Sections with py-4 spacing:
  - Category selector (searchable dropdown)
  - Tags input (multi-select chips)
  - SEO preview card
  - Publishing options (Save as draft checkbox)

### Settings Page

**Firebase Configuration Form:**
- Section header: "Firebase Storage Configuration" with description text
- Form layout: 2-column grid (label | input) with gap-6
- Input fields: Full-width with h-10, border rounded
- Field list: API Key, Auth Domain, Project ID, Storage Bucket, Messaging Sender ID, App ID
- Security note: Prominent alert box above form explaining secure storage
- Save button: Bottom-right sticky bar with "Save Configuration" button

**Categories Management:**
- Two-column layout: Category list (left, w-1/3) | Edit form (right, flex-1)
- List item: py-3 px-4 with hover state, click to edit
- Add category: "+ New Category" button at top of list
- Delete confirmation: Modal dialog with warning

### Comments Management

**Comment Thread View:**
- Nested structure with ml-8 for replies (max one level)
- Each comment card: p-4 rounded-lg border
- Header row: Avatar (w-8 h-8 rounded-full) + Author name + Timestamp
- Content: mt-2 text-sm
- Actions bar: Flex row with "Reply" and "Delete" buttons (text-xs)
- Reply form: Appears inline below comment when "Reply" clicked

### Form Elements

**Text Inputs:**
- Height: h-10 for single-line, auto for textarea
- Border: rounded-md with focus ring
- Label: mb-2 block text-sm font-medium

**Buttons:**
- Primary action: px-6 h-10 rounded-md font-medium
- Secondary action: px-4 h-9 rounded-md
- Icon-only: w-8 h-8 for toolbar/table actions

**Dropdowns/Selects:**
- Height: h-10 to match text inputs
- Chevron icon: Right-aligned
- Menu: Absolute positioning, max-h-60 with scroll

---

## Special Interactions

**Auto-save Indicator:**
- Small pill in top-right of editor: "Saving..." → "Saved" with icon
- Appears only during save actions, fades after 2s

**Image Upload Flow:**
- Click "Upload Image" button in editor
- Browser file picker opens
- Progress bar appears in toolbar during upload
- Image inserts at cursor position when complete
- Error toast appears if upload fails

**Drag & Drop States:**
- Cover upload zone: Border changes on drag-over
- Highlight with dashed border animation during hover

---

## Responsive Behavior

**Desktop (≥1024px):**
- Sidebar + main content side-by-side
- Editor metadata sidebar visible on right
- Table shows all columns

**Tablet (768px-1023px):**
- Collapsible sidebar (hamburger menu)
- Metadata sidebar becomes drawer
- Table remains horizontal with scroll

**Mobile (<768px):**
- Full-width stacked layout
- Sidebar as slide-out drawer
- Table converts to card view
- Toolbar wraps to 2 rows
- Editor padding reduces to p-4

---

## Critical Layout Rules

1. **Consistent Spacing:** Use py-8 between major page sections
2. **Form Alignment:** All form labels align left, inputs full-width of container
3. **Action Buttons:** Always bottom-right or top-right for primary actions
4. **Separation:** Use border-b or border-t for logical content breaks, not arbitrary dividers
5. **Table Density:** Comfortable row height (h-16 to h-20) with hover states
6. **Editor Focus:** Maximize content area, minimize UI chrome when writing

This CMS prioritizes **writing experience** and **content management efficiency** over decorative elements. Every component should feel purposeful and accelerate the user's workflow.