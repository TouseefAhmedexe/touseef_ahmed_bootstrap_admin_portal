# Admin Management Portal

An admin portal built with Bootstrap 5.3.8 and vanilla JavaScript. Task 17 of my Bloomrix
internship. No jQuery and no other framework are used. All data is sample data. There is no
server, so changes to users last only until the page is reloaded.

## Pages
- index.html - dashboard with summary cards, recent activities, an accordion and quick links
- users.html - user table with search, status and role filters, pagination and add, edit and
  delete modals
- register.html - registration form with validation, password strength and an image preview
- settings.html - tabs for profile, account, password and notification settings

## Bootstrap features used
Grid and breakpoints, containers, spacing and display utilities, responsive visibility,
navbar, offcanvas (the mobile sidebar), collapse, accordion, dropdowns, tabs, modals, toasts,
tooltips, cards, badges, alerts, breadcrumbs, pagination, progress bars, list groups,
spinners, button groups, tables (striped, hover, responsive), form controls, switches,
validation classes and color modes (data-bs-theme).

## Folder structure
- lib/bootstrap - the compiled Bootstrap CSS and JS bundle, kept locally
- css/custom.css - all custom styling, loaded after Bootstrap
- js/early-init.js - applies the saved theme and sidebar state before the page is drawn
- js/shared - code used by several pages: API, data functions, DOM helpers, layout, storage,
  validation, password strength, preferences and toasts
- js/pages - one script for each page
- data - users.json and activities.json
- images/avatars - sample profile photos. A user without a photo shows initials

## Customization
Bootstrap files are never edited. custom.css overrides CSS variables: the primary color and
link colors, and the button, pagination and focus variables. A few Bootstrap components
(buttons, pagination, form focus) read their own variables and not --bs-primary, so those
variables are set on the component classes. No !important is used. The dark theme uses
Bootstrap's own color mode, and custom.css only changes the brand colors for it.

## JavaScript and Bootstrap
- Components start from data attributes (data-bs-toggle, data-bs-target, data-bs-dismiss).
- Tooltips and toasts are started with JavaScript.
- The show.bs.modal event and event.relatedTarget tell one modal which user to edit or delete.
- Modals are closed with bootstrap.Modal.getOrCreateInstance(...).hide().
- shown.bs.tab saves the selected tab, and bootstrap.Tab restores it.

## Accessibility
- A skip link, landmarks, labels on every field and a visible focus outline
- aria-current on the active page, aria-expanded and aria-controls on toggles, role=progressbar
  with values, role=status on the result count, and roles on the tabs
- Status badges contain a word, so color is never the only signal
- The validation message is text next to the field and not only a red border
- novalidate is used on the forms so that Bootstrap's feedback shows instead of the
  browser's own message bubbles. The JavaScript checks every field before it accepts a form.

## Storage
localStorage keeps the theme, the sidebar state, the selected settings tab and two
notification switches. It never stores names, emails, phone numbers or passwords.

## Limits
- Nothing is sent to a server. The profile and password forms are checked and not saved.
- The sample users are kept in memory, so a reload restores them.
- Pagination shows every page number. A very long list would need page ranges.

## Tested
Phone 375px, tablet 768px and desktop 1280px. Screenshots are in the screenshots folder.

## How to run
Open the folder in Visual Studio Code and use Live Server. Modules and fetch do not work when
an HTML file is opened by double-clicking it