/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "proxy";
exports.ids = ["proxy"];
exports.modules = {

/***/ "(middleware)/./i18n/request.ts":
/*!*************************!*\
  !*** ./i18n/request.ts ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__),\n/* harmony export */   defaultLocale: () => (/* binding */ defaultLocale),\n/* harmony export */   locales: () => (/* binding */ locales)\n/* harmony export */ });\n/* harmony import */ var next_intl_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next-intl/server */ \"(middleware)/./node_modules/next-intl/dist/esm/development/server/react-server/getRequestConfig.js\");\n\nconst locales = [\n    'pt',\n    'en',\n    'es'\n];\nconst defaultLocale = 'en';\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ((0,next_intl_server__WEBPACK_IMPORTED_MODULE_0__[\"default\"])(async ({ requestLocale })=>{\n    let locale = await requestLocale;\n    if (!locale || !locales.includes(locale)) {\n        locale = defaultLocale;\n    }\n    return {\n        locale,\n        messages: (await __webpack_require__(\"(middleware)/./messages lazy recursive ^\\\\.\\\\/.*\\\\.json$\")(`./${locale}.json`)).default\n    };\n}));\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKG1pZGRsZXdhcmUpLy4vaTE4bi9yZXF1ZXN0LnRzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBb0Q7QUFHN0MsTUFBTUMsVUFBVTtJQUFDO0lBQU07SUFBTTtDQUFLLENBQUM7QUFDbkMsTUFBTUMsZ0JBQWdCLEtBQUs7QUFFbEMsaUVBQWVGLDREQUFnQkEsQ0FBQyxPQUFPLEVBQUVHLGFBQWEsRUFBRTtJQUN0RCxJQUFJQyxTQUFTLE1BQU1EO0lBRW5CLElBQUksQ0FBQ0MsVUFBVSxDQUFDSCxRQUFRSSxRQUFRLENBQUNELFNBQWdCO1FBQy9DQSxTQUFTRjtJQUNYO0lBRUEsT0FBTztRQUNMRTtRQUNBRSxVQUFVLENBQUMsTUFBTSxnRkFBTyxHQUFhLEVBQUVGLE9BQU8sTUFBTSxHQUFHRyxPQUFPO0lBQ2hFO0FBQ0YsRUFBRSxFQUFDIiwic291cmNlcyI6WyJEOlxcQmhhdnlhIHN0dWR5XFxCaGF2eWEgc3R1ZHkgZG9jc1xcTGl2ZV9XaGF0c2FwcF9Qcm9qZWN0XFx3aGF0cy1zYWFzLW1haW5cXGkxOG5cXHJlcXVlc3QudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZ2V0UmVxdWVzdENvbmZpZyB9IGZyb20gJ25leHQtaW50bC9zZXJ2ZXInO1xuaW1wb3J0IHsgbm90Rm91bmQgfSBmcm9tICduZXh0L25hdmlnYXRpb24nO1xuXG5leHBvcnQgY29uc3QgbG9jYWxlcyA9IFsncHQnLCAnZW4nLCAnZXMnXTtcbmV4cG9ydCBjb25zdCBkZWZhdWx0TG9jYWxlID0gJ2VuJztcblxuZXhwb3J0IGRlZmF1bHQgZ2V0UmVxdWVzdENvbmZpZyhhc3luYyAoeyByZXF1ZXN0TG9jYWxlIH0pID0+IHtcbiAgbGV0IGxvY2FsZSA9IGF3YWl0IHJlcXVlc3RMb2NhbGU7XG5cbiAgaWYgKCFsb2NhbGUgfHwgIWxvY2FsZXMuaW5jbHVkZXMobG9jYWxlIGFzIGFueSkpIHtcbiAgICBsb2NhbGUgPSBkZWZhdWx0TG9jYWxlO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBsb2NhbGUsXG4gICAgbWVzc2FnZXM6IChhd2FpdCBpbXBvcnQoYC4uL21lc3NhZ2VzLyR7bG9jYWxlfS5qc29uYCkpLmRlZmF1bHRcbiAgfTtcbn0pOyJdLCJuYW1lcyI6WyJnZXRSZXF1ZXN0Q29uZmlnIiwibG9jYWxlcyIsImRlZmF1bHRMb2NhbGUiLCJyZXF1ZXN0TG9jYWxlIiwibG9jYWxlIiwiaW5jbHVkZXMiLCJtZXNzYWdlcyIsImRlZmF1bHQiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(middleware)/./i18n/request.ts\n");

/***/ }),

/***/ "(middleware)/./i18n/routing.ts":
/*!*************************!*\
  !*** ./i18n/routing.ts ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   Link: () => (/* binding */ Link),\n/* harmony export */   getPathname: () => (/* binding */ getPathname),\n/* harmony export */   redirect: () => (/* binding */ redirect),\n/* harmony export */   routing: () => (/* binding */ routing),\n/* harmony export */   usePathname: () => (/* binding */ usePathname),\n/* harmony export */   useRouter: () => (/* binding */ useRouter)\n/* harmony export */ });\n/* harmony import */ var next_intl_routing__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next-intl/routing */ \"(middleware)/./node_modules/next-intl/dist/esm/development/routing/defineRouting.js\");\n/* harmony import */ var next_intl_navigation__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next-intl/navigation */ \"(middleware)/./node_modules/next-intl/dist/esm/development/navigation/react-server/createNavigation.js\");\n\n\nconst routing = (0,next_intl_routing__WEBPACK_IMPORTED_MODULE_0__[\"default\"])({\n    locales: [\n        'pt',\n        'en',\n        'es'\n    ],\n    defaultLocale: 'en',\n    /** Unprefixed public URLs; locale is applied via middleware rewrite (see ROUTING-FLOW.md). */ localePrefix: 'never'\n});\nconst { Link, redirect, usePathname, useRouter, getPathname } = (0,next_intl_navigation__WEBPACK_IMPORTED_MODULE_1__[\"default\"])(routing);\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKG1pZGRsZXdhcmUpLy4vaTE4bi9yb3V0aW5nLnRzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQWtEO0FBQ007QUFFakQsTUFBTUUsVUFBVUYsNkRBQWFBLENBQUM7SUFDbkNHLFNBQVM7UUFBQztRQUFNO1FBQU07S0FBSztJQUMzQkMsZUFBZTtJQUNmLDRGQUE0RixHQUM1RkMsY0FBYztBQUNoQixHQUFHO0FBRUksTUFBTSxFQUFFQyxJQUFJLEVBQUVDLFFBQVEsRUFBRUMsV0FBVyxFQUFFQyxTQUFTLEVBQUVDLFdBQVcsRUFBRSxHQUNsRVQsZ0VBQWdCQSxDQUFDQyxTQUFTIiwic291cmNlcyI6WyJEOlxcQmhhdnlhIHN0dWR5XFxCaGF2eWEgc3R1ZHkgZG9jc1xcTGl2ZV9XaGF0c2FwcF9Qcm9qZWN0XFx3aGF0cy1zYWFzLW1haW5cXGkxOG5cXHJvdXRpbmcudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZGVmaW5lUm91dGluZyB9IGZyb20gJ25leHQtaW50bC9yb3V0aW5nJztcbmltcG9ydCB7IGNyZWF0ZU5hdmlnYXRpb24gfSBmcm9tICduZXh0LWludGwvbmF2aWdhdGlvbic7XG5cbmV4cG9ydCBjb25zdCByb3V0aW5nID0gZGVmaW5lUm91dGluZyh7XG4gIGxvY2FsZXM6IFsncHQnLCAnZW4nLCAnZXMnXSxcbiAgZGVmYXVsdExvY2FsZTogJ2VuJyxcbiAgLyoqIFVucHJlZml4ZWQgcHVibGljIFVSTHM7IGxvY2FsZSBpcyBhcHBsaWVkIHZpYSBtaWRkbGV3YXJlIHJld3JpdGUgKHNlZSBST1VUSU5HLUZMT1cubWQpLiAqL1xuICBsb2NhbGVQcmVmaXg6ICduZXZlcicsXG59KTtcblxuZXhwb3J0IGNvbnN0IHsgTGluaywgcmVkaXJlY3QsIHVzZVBhdGhuYW1lLCB1c2VSb3V0ZXIsIGdldFBhdGhuYW1lIH0gPVxuICBjcmVhdGVOYXZpZ2F0aW9uKHJvdXRpbmcpOyJdLCJuYW1lcyI6WyJkZWZpbmVSb3V0aW5nIiwiY3JlYXRlTmF2aWdhdGlvbiIsInJvdXRpbmciLCJsb2NhbGVzIiwiZGVmYXVsdExvY2FsZSIsImxvY2FsZVByZWZpeCIsIkxpbmsiLCJyZWRpcmVjdCIsInVzZVBhdGhuYW1lIiwidXNlUm91dGVyIiwiZ2V0UGF0aG5hbWUiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(middleware)/./i18n/routing.ts\n");

/***/ }),

/***/ "(middleware)/./lib/navigation/app-routes.ts":
/*!**************************************!*\
  !*** ./lib/navigation/app-routes.ts ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   APP_PATH_ROOTS: () => (/* binding */ APP_PATH_ROOTS),\n/* harmony export */   PROTECTED_APP_ROOTS: () => (/* binding */ PROTECTED_APP_ROOTS),\n/* harmony export */   isAppPathRoot: () => (/* binding */ isAppPathRoot)\n/* harmony export */ });\n/** First URL segments that are app routes, not locales (next-intl [locale] collision). */ const APP_PATH_ROOTS = [\n    'dashboard',\n    'inbox',\n    'pipeline',\n    'contacts',\n    'campaigns',\n    'calls',\n    'automation',\n    'analytics',\n    'templates',\n    'settings',\n    'pricing',\n    'admin',\n    'sign-in',\n    'sign-up',\n    'forgot-password',\n    'reset-password',\n    'contact',\n    'docs',\n    'privacy',\n    'terms',\n    'onboarding'\n];\nfunction isAppPathRoot(segment) {\n    return APP_PATH_ROOTS.includes(segment);\n}\nconst PROTECTED_APP_ROOTS = [\n    'dashboard',\n    'inbox',\n    'pipeline',\n    'contacts',\n    'campaigns',\n    'calls',\n    'automation',\n    'analytics',\n    'templates',\n    'settings',\n    'admin',\n    'onboarding',\n    'pricing'\n];\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKG1pZGRsZXdhcmUpLy4vbGliL25hdmlnYXRpb24vYXBwLXJvdXRlcy50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSx3RkFBd0YsR0FDakYsTUFBTUEsaUJBQWlCO0lBQzVCO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtDQUNELENBQVU7QUFFSixTQUFTQyxjQUFjQyxPQUFlO0lBQzNDLE9BQU8sZUFBc0NDLFFBQVEsQ0FBQ0Q7QUFDeEQ7QUFFTyxNQUFNRSxzQkFBc0I7SUFDakM7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7Q0FDRCxDQUFVIiwic291cmNlcyI6WyJEOlxcQmhhdnlhIHN0dWR5XFxCaGF2eWEgc3R1ZHkgZG9jc1xcTGl2ZV9XaGF0c2FwcF9Qcm9qZWN0XFx3aGF0cy1zYWFzLW1haW5cXGxpYlxcbmF2aWdhdGlvblxcYXBwLXJvdXRlcy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiogRmlyc3QgVVJMIHNlZ21lbnRzIHRoYXQgYXJlIGFwcCByb3V0ZXMsIG5vdCBsb2NhbGVzIChuZXh0LWludGwgW2xvY2FsZV0gY29sbGlzaW9uKS4gKi9cbmV4cG9ydCBjb25zdCBBUFBfUEFUSF9ST09UUyA9IFtcbiAgJ2Rhc2hib2FyZCcsXG4gICdpbmJveCcsXG4gICdwaXBlbGluZScsXG4gICdjb250YWN0cycsXG4gICdjYW1wYWlnbnMnLFxuICAnY2FsbHMnLFxuICAnYXV0b21hdGlvbicsXG4gICdhbmFseXRpY3MnLFxuICAndGVtcGxhdGVzJyxcbiAgJ3NldHRpbmdzJyxcbiAgJ3ByaWNpbmcnLFxuICAnYWRtaW4nLFxuICAnc2lnbi1pbicsXG4gICdzaWduLXVwJyxcbiAgJ2ZvcmdvdC1wYXNzd29yZCcsXG4gICdyZXNldC1wYXNzd29yZCcsXG4gICdjb250YWN0JyxcbiAgJ2RvY3MnLFxuICAncHJpdmFjeScsXG4gICd0ZXJtcycsXG4gICdvbmJvYXJkaW5nJyxcbl0gYXMgY29uc3Q7XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0FwcFBhdGhSb290KHNlZ21lbnQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gKEFQUF9QQVRIX1JPT1RTIGFzIHJlYWRvbmx5IHN0cmluZ1tdKS5pbmNsdWRlcyhzZWdtZW50KTtcbn1cblxuZXhwb3J0IGNvbnN0IFBST1RFQ1RFRF9BUFBfUk9PVFMgPSBbXG4gICdkYXNoYm9hcmQnLFxuICAnaW5ib3gnLFxuICAncGlwZWxpbmUnLFxuICAnY29udGFjdHMnLFxuICAnY2FtcGFpZ25zJyxcbiAgJ2NhbGxzJyxcbiAgJ2F1dG9tYXRpb24nLFxuICAnYW5hbHl0aWNzJyxcbiAgJ3RlbXBsYXRlcycsXG4gICdzZXR0aW5ncycsXG4gICdhZG1pbicsXG4gICdvbmJvYXJkaW5nJyxcbiAgJ3ByaWNpbmcnLFxuXSBhcyBjb25zdDtcbiJdLCJuYW1lcyI6WyJBUFBfUEFUSF9ST09UUyIsImlzQXBwUGF0aFJvb3QiLCJzZWdtZW50IiwiaW5jbHVkZXMiLCJQUk9URUNURURfQVBQX1JPT1RTIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(middleware)/./lib/navigation/app-routes.ts\n");

/***/ }),

/***/ "(middleware)/./lib/navigation/path-utils.ts":
/*!**************************************!*\
  !*** ./lib/navigation/path-utils.ts ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   pathWithoutLocale: () => (/* binding */ pathWithoutLocale)\n/* harmony export */ });\n/** Strip optional locale prefix from pathname (next-intl). */ function pathWithoutLocale(pathname) {\n    const stripped = pathname.replace(/^\\/(en|pt|es)(?=\\/|$)/, '');\n    if (!stripped || stripped === '') return '/';\n    return stripped.startsWith('/') ? stripped : `/${stripped}`;\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKG1pZGRsZXdhcmUpLy4vbGliL25hdmlnYXRpb24vcGF0aC11dGlscy50cyIsIm1hcHBpbmdzIjoiOzs7O0FBQUEsNERBQTRELEdBQ3JELFNBQVNBLGtCQUFrQkMsUUFBZ0I7SUFDaEQsTUFBTUMsV0FBV0QsU0FBU0UsT0FBTyxDQUFDLHlCQUF5QjtJQUMzRCxJQUFJLENBQUNELFlBQVlBLGFBQWEsSUFBSSxPQUFPO0lBQ3pDLE9BQU9BLFNBQVNFLFVBQVUsQ0FBQyxPQUFPRixXQUFXLENBQUMsQ0FBQyxFQUFFQSxVQUFVO0FBQzdEIiwic291cmNlcyI6WyJEOlxcQmhhdnlhIHN0dWR5XFxCaGF2eWEgc3R1ZHkgZG9jc1xcTGl2ZV9XaGF0c2FwcF9Qcm9qZWN0XFx3aGF0cy1zYWFzLW1haW5cXGxpYlxcbmF2aWdhdGlvblxccGF0aC11dGlscy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiogU3RyaXAgb3B0aW9uYWwgbG9jYWxlIHByZWZpeCBmcm9tIHBhdGhuYW1lIChuZXh0LWludGwpLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhdGhXaXRob3V0TG9jYWxlKHBhdGhuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBzdHJpcHBlZCA9IHBhdGhuYW1lLnJlcGxhY2UoL15cXC8oZW58cHR8ZXMpKD89XFwvfCQpLywgJycpO1xuICBpZiAoIXN0cmlwcGVkIHx8IHN0cmlwcGVkID09PSAnJykgcmV0dXJuICcvJztcbiAgcmV0dXJuIHN0cmlwcGVkLnN0YXJ0c1dpdGgoJy8nKSA/IHN0cmlwcGVkIDogYC8ke3N0cmlwcGVkfWA7XG59XG4iXSwibmFtZXMiOlsicGF0aFdpdGhvdXRMb2NhbGUiLCJwYXRobmFtZSIsInN0cmlwcGVkIiwicmVwbGFjZSIsInN0YXJ0c1dpdGgiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(middleware)/./lib/navigation/path-utils.ts\n");

/***/ }),

/***/ "(middleware)/./lib/navigation/resolve-internal-path.ts":
/*!*************************************************!*\
  !*** ./lib/navigation/resolve-internal-path.ts ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   resolveInternalAppPath: () => (/* binding */ resolveInternalAppPath)\n/* harmony export */ });\n/* harmony import */ var _i18n_request__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @/i18n/request */ \"(middleware)/./i18n/request.ts\");\n/* harmony import */ var _lib_navigation_app_routes__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/lib/navigation/app-routes */ \"(middleware)/./lib/navigation/app-routes.ts\");\n/* harmony import */ var _lib_navigation_path_utils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @/lib/navigation/path-utils */ \"(middleware)/./lib/navigation/path-utils.ts\");\n\n\n\n/**\n * App routes like /dashboard collide with [locale].\n * Map public URL → internal /{locale}/dashboard via rewrite (avoids next-intl 307 loops).\n */ function resolveInternalAppPath(pathname) {\n    const pathNoLocale = (0,_lib_navigation_path_utils__WEBPACK_IMPORTED_MODULE_2__.pathWithoutLocale)(pathname);\n    const segments = pathNoLocale.split('/').filter(Boolean);\n    const appRoot = segments[0];\n    if (!appRoot || !(0,_lib_navigation_app_routes__WEBPACK_IMPORTED_MODULE_1__.isAppPathRoot)(appRoot)) {\n        return null;\n    }\n    const firstSeg = pathname.split('/').filter(Boolean)[0] ?? '';\n    const locale = _i18n_request__WEBPACK_IMPORTED_MODULE_0__.locales.includes(firstSeg) ? firstSeg : _i18n_request__WEBPACK_IMPORTED_MODULE_0__.defaultLocale;\n    return `/${locale}${pathNoLocale}`;\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKG1pZGRsZXdhcmUpLy4vbGliL25hdmlnYXRpb24vcmVzb2x2ZS1pbnRlcm5hbC1wYXRoLnRzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBd0Q7QUFDSTtBQUNJO0FBSWhFOzs7Q0FHQyxHQUNNLFNBQVNJLHVCQUF1QkMsUUFBZ0I7SUFDckQsTUFBTUMsZUFBZUgsNkVBQWlCQSxDQUFDRTtJQUN2QyxNQUFNRSxXQUFXRCxhQUFhRSxLQUFLLENBQUMsS0FBS0MsTUFBTSxDQUFDQztJQUNoRCxNQUFNQyxVQUFVSixRQUFRLENBQUMsRUFBRTtJQUUzQixJQUFJLENBQUNJLFdBQVcsQ0FBQ1QseUVBQWFBLENBQUNTLFVBQVU7UUFDdkMsT0FBTztJQUNUO0lBRUEsTUFBTUMsV0FBV1AsU0FBU0csS0FBSyxDQUFDLEtBQUtDLE1BQU0sQ0FBQ0MsUUFBUSxDQUFDLEVBQUUsSUFBSTtJQUMzRCxNQUFNRyxTQUFpQmIsa0RBQU9BLENBQUNjLFFBQVEsQ0FBQ0YsWUFDbkNBLFdBQ0RYLHdEQUFhQTtJQUVqQixPQUFPLENBQUMsQ0FBQyxFQUFFWSxTQUFTUCxjQUFjO0FBQ3BDIiwic291cmNlcyI6WyJEOlxcQmhhdnlhIHN0dWR5XFxCaGF2eWEgc3R1ZHkgZG9jc1xcTGl2ZV9XaGF0c2FwcF9Qcm9qZWN0XFx3aGF0cy1zYWFzLW1haW5cXGxpYlxcbmF2aWdhdGlvblxccmVzb2x2ZS1pbnRlcm5hbC1wYXRoLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGxvY2FsZXMsIGRlZmF1bHRMb2NhbGUgfSBmcm9tICdAL2kxOG4vcmVxdWVzdCc7XG5pbXBvcnQgeyBpc0FwcFBhdGhSb290IH0gZnJvbSAnQC9saWIvbmF2aWdhdGlvbi9hcHAtcm91dGVzJztcbmltcG9ydCB7IHBhdGhXaXRob3V0TG9jYWxlIH0gZnJvbSAnQC9saWIvbmF2aWdhdGlvbi9wYXRoLXV0aWxzJztcblxudHlwZSBMb2NhbGUgPSAodHlwZW9mIGxvY2FsZXMpW251bWJlcl07XG5cbi8qKlxuICogQXBwIHJvdXRlcyBsaWtlIC9kYXNoYm9hcmQgY29sbGlkZSB3aXRoIFtsb2NhbGVdLlxuICogTWFwIHB1YmxpYyBVUkwg4oaSIGludGVybmFsIC97bG9jYWxlfS9kYXNoYm9hcmQgdmlhIHJld3JpdGUgKGF2b2lkcyBuZXh0LWludGwgMzA3IGxvb3BzKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVJbnRlcm5hbEFwcFBhdGgocGF0aG5hbWU6IHN0cmluZyk6IHN0cmluZyB8IG51bGwge1xuICBjb25zdCBwYXRoTm9Mb2NhbGUgPSBwYXRoV2l0aG91dExvY2FsZShwYXRobmFtZSk7XG4gIGNvbnN0IHNlZ21lbnRzID0gcGF0aE5vTG9jYWxlLnNwbGl0KCcvJykuZmlsdGVyKEJvb2xlYW4pO1xuICBjb25zdCBhcHBSb290ID0gc2VnbWVudHNbMF07XG5cbiAgaWYgKCFhcHBSb290IHx8ICFpc0FwcFBhdGhSb290KGFwcFJvb3QpKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBjb25zdCBmaXJzdFNlZyA9IHBhdGhuYW1lLnNwbGl0KCcvJykuZmlsdGVyKEJvb2xlYW4pWzBdID8/ICcnO1xuICBjb25zdCBsb2NhbGU6IExvY2FsZSA9IGxvY2FsZXMuaW5jbHVkZXMoZmlyc3RTZWcgYXMgTG9jYWxlKVxuICAgID8gKGZpcnN0U2VnIGFzIExvY2FsZSlcbiAgICA6IGRlZmF1bHRMb2NhbGU7XG5cbiAgcmV0dXJuIGAvJHtsb2NhbGV9JHtwYXRoTm9Mb2NhbGV9YDtcbn1cbiJdLCJuYW1lcyI6WyJsb2NhbGVzIiwiZGVmYXVsdExvY2FsZSIsImlzQXBwUGF0aFJvb3QiLCJwYXRoV2l0aG91dExvY2FsZSIsInJlc29sdmVJbnRlcm5hbEFwcFBhdGgiLCJwYXRobmFtZSIsInBhdGhOb0xvY2FsZSIsInNlZ21lbnRzIiwic3BsaXQiLCJmaWx0ZXIiLCJCb29sZWFuIiwiYXBwUm9vdCIsImZpcnN0U2VnIiwibG9jYWxlIiwiaW5jbHVkZXMiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(middleware)/./lib/navigation/resolve-internal-path.ts\n");

/***/ }),

/***/ "(middleware)/./lib/navigation/rewrite-with-locale.ts":
/*!***********************************************!*\
  !*** ./lib/navigation/rewrite-with-locale.ts ***!
  \***********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   NEXT_INTL_LOCALE_HEADER: () => (/* binding */ NEXT_INTL_LOCALE_HEADER),\n/* harmony export */   localeFromInternalPath: () => (/* binding */ localeFromInternalPath),\n/* harmony export */   rewriteWithLocale: () => (/* binding */ rewriteWithLocale)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(middleware)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var _i18n_request__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/i18n/request */ \"(middleware)/./i18n/request.ts\");\n\n\n/** Header next-intl reads for `getRequestLocale()` on rewritten requests. */ const NEXT_INTL_LOCALE_HEADER = 'X-NEXT-INTL-LOCALE';\nfunction localeFromInternalPath(internalPath) {\n    const seg = internalPath.split('/').filter(Boolean)[0] ?? '';\n    return _i18n_request__WEBPACK_IMPORTED_MODULE_1__.locales.includes(seg) ? seg : _i18n_request__WEBPACK_IMPORTED_MODULE_1__.defaultLocale;\n}\n/** Rewrite to an internal /{locale}/… path and pass locale to Server Components. */ function rewriteWithLocale(request, internalPath) {\n    const locale = localeFromInternalPath(internalPath);\n    const url = new URL(internalPath, request.url);\n    const requestHeaders = new Headers(request.headers);\n    requestHeaders.set(NEXT_INTL_LOCALE_HEADER, locale);\n    return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.rewrite(url, {\n        request: {\n            headers: requestHeaders\n        }\n    });\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKG1pZGRsZXdhcmUpLy4vbGliL25hdmlnYXRpb24vcmV3cml0ZS13aXRoLWxvY2FsZS50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUF3RDtBQUNBO0FBRXhELDJFQUEyRSxHQUNwRSxNQUFNRywwQkFBMEIscUJBQXFCO0FBSXJELFNBQVNDLHVCQUF1QkMsWUFBb0I7SUFDekQsTUFBTUMsTUFBTUQsYUFBYUUsS0FBSyxDQUFDLEtBQUtDLE1BQU0sQ0FBQ0MsUUFBUSxDQUFDLEVBQUUsSUFBSTtJQUMxRCxPQUFPUixrREFBT0EsQ0FBQ1MsUUFBUSxDQUFDSixPQUFrQkEsTUFBaUJKLHdEQUFhQTtBQUMxRTtBQUVBLGtGQUFrRixHQUMzRSxTQUFTUyxrQkFDZEMsT0FBb0IsRUFDcEJQLFlBQW9CO0lBRXBCLE1BQU1RLFNBQVNULHVCQUF1QkM7SUFDdEMsTUFBTVMsTUFBTSxJQUFJQyxJQUFJVixjQUFjTyxRQUFRRSxHQUFHO0lBQzdDLE1BQU1FLGlCQUFpQixJQUFJQyxRQUFRTCxRQUFRTSxPQUFPO0lBQ2xERixlQUFlRyxHQUFHLENBQUNoQix5QkFBeUJVO0lBRTVDLE9BQU9iLHFEQUFZQSxDQUFDb0IsT0FBTyxDQUFDTixLQUFLO1FBQy9CRixTQUFTO1lBQUVNLFNBQVNGO1FBQWU7SUFDckM7QUFDRiIsInNvdXJjZXMiOlsiRDpcXEJoYXZ5YSBzdHVkeVxcQmhhdnlhIHN0dWR5IGRvY3NcXExpdmVfV2hhdHNhcHBfUHJvamVjdFxcd2hhdHMtc2Fhcy1tYWluXFxsaWJcXG5hdmlnYXRpb25cXHJld3JpdGUtd2l0aC1sb2NhbGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTmV4dFJlcXVlc3QsIE5leHRSZXNwb25zZSB9IGZyb20gJ25leHQvc2VydmVyJztcbmltcG9ydCB7IGxvY2FsZXMsIGRlZmF1bHRMb2NhbGUgfSBmcm9tICdAL2kxOG4vcmVxdWVzdCc7XG5cbi8qKiBIZWFkZXIgbmV4dC1pbnRsIHJlYWRzIGZvciBgZ2V0UmVxdWVzdExvY2FsZSgpYCBvbiByZXdyaXR0ZW4gcmVxdWVzdHMuICovXG5leHBvcnQgY29uc3QgTkVYVF9JTlRMX0xPQ0FMRV9IRUFERVIgPSAnWC1ORVhULUlOVEwtTE9DQUxFJztcblxudHlwZSBMb2NhbGUgPSAodHlwZW9mIGxvY2FsZXMpW251bWJlcl07XG5cbmV4cG9ydCBmdW5jdGlvbiBsb2NhbGVGcm9tSW50ZXJuYWxQYXRoKGludGVybmFsUGF0aDogc3RyaW5nKTogTG9jYWxlIHtcbiAgY29uc3Qgc2VnID0gaW50ZXJuYWxQYXRoLnNwbGl0KCcvJykuZmlsdGVyKEJvb2xlYW4pWzBdID8/ICcnO1xuICByZXR1cm4gbG9jYWxlcy5pbmNsdWRlcyhzZWcgYXMgTG9jYWxlKSA/IChzZWcgYXMgTG9jYWxlKSA6IGRlZmF1bHRMb2NhbGU7XG59XG5cbi8qKiBSZXdyaXRlIHRvIGFuIGludGVybmFsIC97bG9jYWxlfS/igKYgcGF0aCBhbmQgcGFzcyBsb2NhbGUgdG8gU2VydmVyIENvbXBvbmVudHMuICovXG5leHBvcnQgZnVuY3Rpb24gcmV3cml0ZVdpdGhMb2NhbGUoXG4gIHJlcXVlc3Q6IE5leHRSZXF1ZXN0LFxuICBpbnRlcm5hbFBhdGg6IHN0cmluZ1xuKTogTmV4dFJlc3BvbnNlIHtcbiAgY29uc3QgbG9jYWxlID0gbG9jYWxlRnJvbUludGVybmFsUGF0aChpbnRlcm5hbFBhdGgpO1xuICBjb25zdCB1cmwgPSBuZXcgVVJMKGludGVybmFsUGF0aCwgcmVxdWVzdC51cmwpO1xuICBjb25zdCByZXF1ZXN0SGVhZGVycyA9IG5ldyBIZWFkZXJzKHJlcXVlc3QuaGVhZGVycyk7XG4gIHJlcXVlc3RIZWFkZXJzLnNldChORVhUX0lOVExfTE9DQUxFX0hFQURFUiwgbG9jYWxlKTtcblxuICByZXR1cm4gTmV4dFJlc3BvbnNlLnJld3JpdGUodXJsLCB7XG4gICAgcmVxdWVzdDogeyBoZWFkZXJzOiByZXF1ZXN0SGVhZGVycyB9LFxuICB9KTtcbn1cbiJdLCJuYW1lcyI6WyJOZXh0UmVzcG9uc2UiLCJsb2NhbGVzIiwiZGVmYXVsdExvY2FsZSIsIk5FWFRfSU5UTF9MT0NBTEVfSEVBREVSIiwibG9jYWxlRnJvbUludGVybmFsUGF0aCIsImludGVybmFsUGF0aCIsInNlZyIsInNwbGl0IiwiZmlsdGVyIiwiQm9vbGVhbiIsImluY2x1ZGVzIiwicmV3cml0ZVdpdGhMb2NhbGUiLCJyZXF1ZXN0IiwibG9jYWxlIiwidXJsIiwiVVJMIiwicmVxdWVzdEhlYWRlcnMiLCJIZWFkZXJzIiwiaGVhZGVycyIsInNldCIsInJld3JpdGUiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(middleware)/./lib/navigation/rewrite-with-locale.ts\n");

/***/ }),

/***/ "(middleware)/./messages lazy recursive ^\\.\\/.*\\.json$":
/*!********************************************************!*\
  !*** ./messages/ lazy ^\.\/.*\.json$ namespace object ***!
  \********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var map = {
	"./en.json": [
		"(middleware)/./messages/en.json",
		"_middleware_messages_en_json"
	],
	"./es.json": [
		"(middleware)/./messages/es.json",
		"_middleware_messages_es_json"
	],
	"./pt.json": [
		"(middleware)/./messages/pt.json",
		"_middleware_messages_pt_json"
	]
};
function webpackAsyncContext(req) {
	if(!__webpack_require__.o(map, req)) {
		return Promise.resolve().then(() => {
			var e = new Error("Cannot find module '" + req + "'");
			e.code = 'MODULE_NOT_FOUND';
			throw e;
		});
	}

	var ids = map[req], id = ids[0];
	return __webpack_require__.e(ids[1]).then(() => {
		return __webpack_require__.t(id, 3 | 16);
	});
}
webpackAsyncContext.keys = () => (Object.keys(map));
webpackAsyncContext.id = "(middleware)/./messages lazy recursive ^\\.\\/.*\\.json$";
module.exports = webpackAsyncContext;

/***/ }),

/***/ "(middleware)/./node_modules/next/dist/build/webpack/loaders/next-middleware-loader.js?absolutePagePath=D%3A%5CBhavya%20study%5CBhavya%20study%20docs%5CLive_Whatsapp_Project%5Cwhats-saas-main%5Cproxy.ts&page=%2Fproxy&rootDir=D%3A%5CBhavya%20study%5CBhavya%20study%20docs%5CLive_Whatsapp_Project%5Cwhats-saas-main&matchers=&preferredRegion=&middlewareConfig=e30%3D!":
/*!**********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-middleware-loader.js?absolutePagePath=D%3A%5CBhavya%20study%5CBhavya%20study%20docs%5CLive_Whatsapp_Project%5Cwhats-saas-main%5Cproxy.ts&page=%2Fproxy&rootDir=D%3A%5CBhavya%20study%5CBhavya%20study%20docs%5CLive_Whatsapp_Project%5Cwhats-saas-main&matchers=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \**********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__),\n/* harmony export */   handler: () => (/* binding */ handler)\n/* harmony export */ });\n/* harmony import */ var next_dist_build_adapter_setup_node_env_external__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/build/adapter/setup-node-env.external */ \"next/dist/build/adapter/setup-node-env.external\");\n/* harmony import */ var next_dist_build_adapter_setup_node_env_external__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_build_adapter_setup_node_env_external__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_web_globals__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/web/globals */ \"(middleware)/./node_modules/next/dist/server/web/globals.js\");\n/* harmony import */ var next_dist_server_web_globals__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_web_globals__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var next_dist_server_web_adapter__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/web/adapter */ \"(middleware)/./node_modules/next/dist/server/web/adapter.js\");\n/* harmony import */ var next_dist_server_web_adapter__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_web_adapter__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var next_dist_server_lib_incremental_cache__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! next/dist/server/lib/incremental-cache */ \"(middleware)/./node_modules/next/dist/server/lib/incremental-cache/index.js\");\n/* harmony import */ var next_dist_server_lib_incremental_cache__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_incremental_cache__WEBPACK_IMPORTED_MODULE_3__);\n/* harmony import */ var _proxy_ts__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./proxy.ts */ \"(middleware)/./proxy.ts\");\n/* harmony import */ var next_dist_client_components_is_next_router_error__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! next/dist/client/components/is-next-router-error */ \"(middleware)/./node_modules/next/dist/client/components/is-next-router-error.js\");\n/* harmony import */ var next_dist_client_components_is_next_router_error__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(next_dist_client_components_is_next_router_error__WEBPACK_IMPORTED_MODULE_5__);\n/* harmony import */ var next_dist_server_web_utils__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! next/dist/server/web/utils */ \"(middleware)/./node_modules/next/dist/server/web/utils.js\");\n/* harmony import */ var next_dist_server_web_utils__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_web_utils__WEBPACK_IMPORTED_MODULE_6__);\n\n\n\n\nconst incrementalCacheHandler = null\n// Import the userland code.\n;\n\n\n\nconst mod = {\n    ..._proxy_ts__WEBPACK_IMPORTED_MODULE_4__\n};\nconst page = \"/proxy\";\nconst isProxy = page === '/proxy' || page === '/src/proxy';\nconst handlerUserland = (isProxy ? mod.proxy : mod.middleware) || mod.default;\nclass ProxyMissingExportError extends Error {\n    constructor(message){\n        super(message);\n        // Stack isn't useful here, remove it considering it spams logs during development.\n        this.stack = '';\n    }\n}\n// TODO: This spams logs during development. Find a better way to handle this.\n// Removing this will spam \"fn is not a function\" logs which is worse.\nif (typeof handlerUserland !== 'function') {\n    throw new ProxyMissingExportError(`The ${isProxy ? 'Proxy' : 'Middleware'} file \"${page}\" must export a function named \\`${isProxy ? 'proxy' : 'middleware'}\\` or a default function.`);\n}\n// Proxy will only sent out the FetchEvent to next server,\n// so load instrumentation module here and track the error inside proxy module.\nfunction errorHandledHandler(fn) {\n    return async (...args)=>{\n        try {\n            return await fn(...args);\n        } catch (err) {\n            // In development, error the navigation API usage in runtime,\n            // since it's not allowed to be used in proxy as it's outside of react component tree.\n            if (true) {\n                if ((0,next_dist_client_components_is_next_router_error__WEBPACK_IMPORTED_MODULE_5__.isNextRouterError)(err)) {\n                    err.message = `Next.js navigation API is not allowed to be used in ${isProxy ? 'Proxy' : 'Middleware'}.`;\n                    throw err;\n                }\n            }\n            const req = args[0];\n            const url = new URL(req.url);\n            const resource = url.pathname + url.search;\n            await (0,next_dist_server_web_globals__WEBPACK_IMPORTED_MODULE_1__.edgeInstrumentationOnRequestError)(err, {\n                path: resource,\n                method: req.method,\n                headers: Object.fromEntries(req.headers.entries())\n            }, {\n                routerKind: 'Pages Router',\n                routePath: '/proxy',\n                routeType: 'proxy',\n                revalidateReason: undefined\n            });\n            throw err;\n        }\n    };\n}\nconst internalHandler = (opts)=>{\n    return (0,next_dist_server_web_adapter__WEBPACK_IMPORTED_MODULE_2__.adapter)({\n        ...opts,\n        IncrementalCache: next_dist_server_lib_incremental_cache__WEBPACK_IMPORTED_MODULE_3__.IncrementalCache,\n        incrementalCacheHandler,\n        page,\n        handler: errorHandledHandler(handlerUserland)\n    });\n};\nasync function handler(request, ctx) {\n    const result = await internalHandler({\n        request: {\n            url: request.url,\n            method: request.method,\n            headers: (0,next_dist_server_web_utils__WEBPACK_IMPORTED_MODULE_6__.toNodeOutgoingHttpHeaders)(request.headers),\n            nextConfig: {\n                basePath: \"\",\n                i18n: \"\",\n                trailingSlash: Boolean(false),\n                experimental: {\n                    cacheLife: {\"default\":{\"stale\":300,\"revalidate\":900,\"expire\":4294967294},\"seconds\":{\"stale\":30,\"revalidate\":1,\"expire\":60},\"minutes\":{\"stale\":300,\"revalidate\":60,\"expire\":3600},\"hours\":{\"stale\":300,\"revalidate\":3600,\"expire\":86400},\"days\":{\"stale\":300,\"revalidate\":86400,\"expire\":604800},\"weeks\":{\"stale\":300,\"revalidate\":604800,\"expire\":2592000},\"max\":{\"stale\":300,\"revalidate\":2592000,\"expire\":31536000}},\n                    authInterrupts: Boolean(false),\n                    clientParamParsingOrigins: []\n                }\n            },\n            page: {\n                name: page\n            },\n            body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body ?? undefined : undefined,\n            waitUntil: ctx.waitUntil,\n            requestMeta: ctx.requestMeta,\n            signal: ctx.signal || new AbortController().signal\n        }\n    });\n    ctx.waitUntil == null ? void 0 : ctx.waitUntil.call(ctx, result.waitUntil);\n    return result.response;\n}\n// backwards compat\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (internalHandler);\n\n//# sourceMappingURL=middleware.js.map\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKG1pZGRsZXdhcmUpLy4vbm9kZV9tb2R1bGVzL25leHQvZGlzdC9idWlsZC93ZWJwYWNrL2xvYWRlcnMvbmV4dC1taWRkbGV3YXJlLWxvYWRlci5qcz9hYnNvbHV0ZVBhZ2VQYXRoPUQlM0ElNUNCaGF2eWElMjBzdHVkeSU1Q0JoYXZ5YSUyMHN0dWR5JTIwZG9jcyU1Q0xpdmVfV2hhdHNhcHBfUHJvamVjdCU1Q3doYXRzLXNhYXMtbWFpbiU1Q3Byb3h5LnRzJnBhZ2U9JTJGcHJveHkmcm9vdERpcj1EJTNBJTVDQmhhdnlhJTIwc3R1ZHklNUNCaGF2eWElMjBzdHVkeSUyMGRvY3MlNUNMaXZlX1doYXRzYXBwX1Byb2plY3QlNUN3aGF0cy1zYWFzLW1haW4mbWF0Y2hlcnM9JnByZWZlcnJlZFJlZ2lvbj0mbWlkZGxld2FyZUNvbmZpZz1lMzAlM0QhIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUF5RDtBQUNuQjtBQUNpQjtBQUNtQjtBQUMxRTtBQUNBO0FBQ0EsQ0FBbUM7QUFDOEM7QUFDSTtBQUNkO0FBQ3ZFO0FBQ0EsT0FBTyxzQ0FBSTtBQUNYO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw2Q0FBNkMsa0NBQWtDLFFBQVEsS0FBSyxtQ0FBbUMsaUNBQWlDO0FBQ2hLO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQSxnQkFBZ0IsSUFBcUM7QUFDckQsb0JBQW9CLG1HQUFpQjtBQUNyQyx5RkFBeUYsaUNBQWlDO0FBQzFIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQiwrRkFBaUM7QUFDbkQ7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLHFFQUFPO0FBQ2xCO0FBQ0Esd0JBQXdCO0FBQ3hCO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUIscUZBQXlCO0FBQzlDO0FBQ0EsMEJBQTBCLEVBQTRCO0FBQ3RELHNCQUFzQixFQUE4QjtBQUNwRCx1Q0FBdUMsS0FBaUM7QUFDeEU7QUFDQSwrQkFBK0IsMllBQTZCO0FBQzVELDRDQUE0QyxLQUErQztBQUMzRiwrQ0FBK0MsRUFBK0M7QUFDOUY7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUVBQWUsZUFBZSxFQUFDOztBQUUvQiIsInNvdXJjZXMiOlsiIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBcIm5leHQvZGlzdC9idWlsZC9hZGFwdGVyL3NldHVwLW5vZGUtZW52LmV4dGVybmFsXCI7XG5pbXBvcnQgXCJuZXh0L2Rpc3Qvc2VydmVyL3dlYi9nbG9iYWxzXCI7XG5pbXBvcnQgeyBhZGFwdGVyIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvd2ViL2FkYXB0ZXJcIjtcbmltcG9ydCB7IEluY3JlbWVudGFsQ2FjaGUgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9saWIvaW5jcmVtZW50YWwtY2FjaGVcIjtcbmNvbnN0IGluY3JlbWVudGFsQ2FjaGVIYW5kbGVyID0gbnVsbFxuLy8gSW1wb3J0IHRoZSB1c2VybGFuZCBjb2RlLlxuaW1wb3J0ICogYXMgX21vZCBmcm9tIFwiLi9wcm94eS50c1wiO1xuaW1wb3J0IHsgZWRnZUluc3RydW1lbnRhdGlvbk9uUmVxdWVzdEVycm9yIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvd2ViL2dsb2JhbHNcIjtcbmltcG9ydCB7IGlzTmV4dFJvdXRlckVycm9yIH0gZnJvbSBcIm5leHQvZGlzdC9jbGllbnQvY29tcG9uZW50cy9pcy1uZXh0LXJvdXRlci1lcnJvclwiO1xuaW1wb3J0IHsgdG9Ob2RlT3V0Z29pbmdIdHRwSGVhZGVycyB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL3dlYi91dGlsc1wiO1xuY29uc3QgbW9kID0ge1xuICAgIC4uLl9tb2Rcbn07XG5jb25zdCBwYWdlID0gXCIvcHJveHlcIjtcbmNvbnN0IGlzUHJveHkgPSBwYWdlID09PSAnL3Byb3h5JyB8fCBwYWdlID09PSAnL3NyYy9wcm94eSc7XG5jb25zdCBoYW5kbGVyVXNlcmxhbmQgPSAoaXNQcm94eSA/IG1vZC5wcm94eSA6IG1vZC5taWRkbGV3YXJlKSB8fCBtb2QuZGVmYXVsdDtcbmNsYXNzIFByb3h5TWlzc2luZ0V4cG9ydEVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICAgIGNvbnN0cnVjdG9yKG1lc3NhZ2Upe1xuICAgICAgICBzdXBlcihtZXNzYWdlKTtcbiAgICAgICAgLy8gU3RhY2sgaXNuJ3QgdXNlZnVsIGhlcmUsIHJlbW92ZSBpdCBjb25zaWRlcmluZyBpdCBzcGFtcyBsb2dzIGR1cmluZyBkZXZlbG9wbWVudC5cbiAgICAgICAgdGhpcy5zdGFjayA9ICcnO1xuICAgIH1cbn1cbi8vIFRPRE86IFRoaXMgc3BhbXMgbG9ncyBkdXJpbmcgZGV2ZWxvcG1lbnQuIEZpbmQgYSBiZXR0ZXIgd2F5IHRvIGhhbmRsZSB0aGlzLlxuLy8gUmVtb3ZpbmcgdGhpcyB3aWxsIHNwYW0gXCJmbiBpcyBub3QgYSBmdW5jdGlvblwiIGxvZ3Mgd2hpY2ggaXMgd29yc2UuXG5pZiAodHlwZW9mIGhhbmRsZXJVc2VybGFuZCAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHRocm93IG5ldyBQcm94eU1pc3NpbmdFeHBvcnRFcnJvcihgVGhlICR7aXNQcm94eSA/ICdQcm94eScgOiAnTWlkZGxld2FyZSd9IGZpbGUgXCIke3BhZ2V9XCIgbXVzdCBleHBvcnQgYSBmdW5jdGlvbiBuYW1lZCBcXGAke2lzUHJveHkgPyAncHJveHknIDogJ21pZGRsZXdhcmUnfVxcYCBvciBhIGRlZmF1bHQgZnVuY3Rpb24uYCk7XG59XG4vLyBQcm94eSB3aWxsIG9ubHkgc2VudCBvdXQgdGhlIEZldGNoRXZlbnQgdG8gbmV4dCBzZXJ2ZXIsXG4vLyBzbyBsb2FkIGluc3RydW1lbnRhdGlvbiBtb2R1bGUgaGVyZSBhbmQgdHJhY2sgdGhlIGVycm9yIGluc2lkZSBwcm94eSBtb2R1bGUuXG5mdW5jdGlvbiBlcnJvckhhbmRsZWRIYW5kbGVyKGZuKSB7XG4gICAgcmV0dXJuIGFzeW5jICguLi5hcmdzKT0+e1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IGZuKC4uLmFyZ3MpO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIC8vIEluIGRldmVsb3BtZW50LCBlcnJvciB0aGUgbmF2aWdhdGlvbiBBUEkgdXNhZ2UgaW4gcnVudGltZSxcbiAgICAgICAgICAgIC8vIHNpbmNlIGl0J3Mgbm90IGFsbG93ZWQgdG8gYmUgdXNlZCBpbiBwcm94eSBhcyBpdCdzIG91dHNpZGUgb2YgcmVhY3QgY29tcG9uZW50IHRyZWUuXG4gICAgICAgICAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgICAgICAgICAgICAgIGlmIChpc05leHRSb3V0ZXJFcnJvcihlcnIpKSB7XG4gICAgICAgICAgICAgICAgICAgIGVyci5tZXNzYWdlID0gYE5leHQuanMgbmF2aWdhdGlvbiBBUEkgaXMgbm90IGFsbG93ZWQgdG8gYmUgdXNlZCBpbiAke2lzUHJveHkgPyAnUHJveHknIDogJ01pZGRsZXdhcmUnfS5gO1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgcmVxID0gYXJnc1swXTtcbiAgICAgICAgICAgIGNvbnN0IHVybCA9IG5ldyBVUkwocmVxLnVybCk7XG4gICAgICAgICAgICBjb25zdCByZXNvdXJjZSA9IHVybC5wYXRobmFtZSArIHVybC5zZWFyY2g7XG4gICAgICAgICAgICBhd2FpdCBlZGdlSW5zdHJ1bWVudGF0aW9uT25SZXF1ZXN0RXJyb3IoZXJyLCB7XG4gICAgICAgICAgICAgICAgcGF0aDogcmVzb3VyY2UsXG4gICAgICAgICAgICAgICAgbWV0aG9kOiByZXEubWV0aG9kLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IE9iamVjdC5mcm9tRW50cmllcyhyZXEuaGVhZGVycy5lbnRyaWVzKCkpXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgcm91dGVyS2luZDogJ1BhZ2VzIFJvdXRlcicsXG4gICAgICAgICAgICAgICAgcm91dGVQYXRoOiAnL3Byb3h5JyxcbiAgICAgICAgICAgICAgICByb3V0ZVR5cGU6ICdwcm94eScsXG4gICAgICAgICAgICAgICAgcmV2YWxpZGF0ZVJlYXNvbjogdW5kZWZpbmVkXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgfVxuICAgIH07XG59XG5jb25zdCBpbnRlcm5hbEhhbmRsZXIgPSAob3B0cyk9PntcbiAgICByZXR1cm4gYWRhcHRlcih7XG4gICAgICAgIC4uLm9wdHMsXG4gICAgICAgIEluY3JlbWVudGFsQ2FjaGUsXG4gICAgICAgIGluY3JlbWVudGFsQ2FjaGVIYW5kbGVyLFxuICAgICAgICBwYWdlLFxuICAgICAgICBoYW5kbGVyOiBlcnJvckhhbmRsZWRIYW5kbGVyKGhhbmRsZXJVc2VybGFuZClcbiAgICB9KTtcbn07XG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlcihyZXF1ZXN0LCBjdHgpIHtcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBpbnRlcm5hbEhhbmRsZXIoe1xuICAgICAgICByZXF1ZXN0OiB7XG4gICAgICAgICAgICB1cmw6IHJlcXVlc3QudXJsLFxuICAgICAgICAgICAgbWV0aG9kOiByZXF1ZXN0Lm1ldGhvZCxcbiAgICAgICAgICAgIGhlYWRlcnM6IHRvTm9kZU91dGdvaW5nSHR0cEhlYWRlcnMocmVxdWVzdC5oZWFkZXJzKSxcbiAgICAgICAgICAgIG5leHRDb25maWc6IHtcbiAgICAgICAgICAgICAgICBiYXNlUGF0aDogcHJvY2Vzcy5lbnYuX19ORVhUX0JBU0VfUEFUSCxcbiAgICAgICAgICAgICAgICBpMThuOiBwcm9jZXNzLmVudi5fX05FWFRfSTE4Tl9DT05GSUcsXG4gICAgICAgICAgICAgICAgdHJhaWxpbmdTbGFzaDogQm9vbGVhbihwcm9jZXNzLmVudi5fX05FWFRfVFJBSUxJTkdfU0xBU0gpLFxuICAgICAgICAgICAgICAgIGV4cGVyaW1lbnRhbDoge1xuICAgICAgICAgICAgICAgICAgICBjYWNoZUxpZmU6IHByb2Nlc3MuZW52Ll9fTkVYVF9DQUNIRV9MSUZFLFxuICAgICAgICAgICAgICAgICAgICBhdXRoSW50ZXJydXB0czogQm9vbGVhbihwcm9jZXNzLmVudi5fX05FWFRfRVhQRVJJTUVOVEFMX0FVVEhfSU5URVJSVVBUUyksXG4gICAgICAgICAgICAgICAgICAgIGNsaWVudFBhcmFtUGFyc2luZ09yaWdpbnM6IHByb2Nlc3MuZW52Ll9fTkVYVF9DTElFTlRfUEFSQU1fUEFSU0lOR19PUklHSU5TXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHBhZ2U6IHtcbiAgICAgICAgICAgICAgICBuYW1lOiBwYWdlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYm9keTogcmVxdWVzdC5tZXRob2QgIT09ICdHRVQnICYmIHJlcXVlc3QubWV0aG9kICE9PSAnSEVBRCcgPyByZXF1ZXN0LmJvZHkgPz8gdW5kZWZpbmVkIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgd2FpdFVudGlsOiBjdHgud2FpdFVudGlsLFxuICAgICAgICAgICAgcmVxdWVzdE1ldGE6IGN0eC5yZXF1ZXN0TWV0YSxcbiAgICAgICAgICAgIHNpZ25hbDogY3R4LnNpZ25hbCB8fCBuZXcgQWJvcnRDb250cm9sbGVyKCkuc2lnbmFsXG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBjdHgud2FpdFVudGlsID09IG51bGwgPyB2b2lkIDAgOiBjdHgud2FpdFVudGlsLmNhbGwoY3R4LCByZXN1bHQud2FpdFVudGlsKTtcbiAgICByZXR1cm4gcmVzdWx0LnJlc3BvbnNlO1xufVxuLy8gYmFja3dhcmRzIGNvbXBhdFxuZXhwb3J0IGRlZmF1bHQgaW50ZXJuYWxIYW5kbGVyO1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1taWRkbGV3YXJlLmpzLm1hcFxuIl0sIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(middleware)/./node_modules/next/dist/build/webpack/loaders/next-middleware-loader.js?absolutePagePath=D%3A%5CBhavya%20study%5CBhavya%20study%20docs%5CLive_Whatsapp_Project%5Cwhats-saas-main%5Cproxy.ts&page=%2Fproxy&rootDir=D%3A%5CBhavya%20study%5CBhavya%20study%20docs%5CLive_Whatsapp_Project%5Cwhats-saas-main&matchers=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(middleware)/./proxy.ts":
/*!******************!*\
  !*** ./proxy.ts ***!
  \******************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   config: () => (/* binding */ config),\n/* harmony export */   proxy: () => (/* binding */ proxy)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(middleware)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var next_intl_middleware__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! next-intl/middleware */ \"(middleware)/./node_modules/next-intl/dist/esm/development/middleware/middleware.js\");\n/* harmony import */ var _lib_navigation_app_routes__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/lib/navigation/app-routes */ \"(middleware)/./lib/navigation/app-routes.ts\");\n/* harmony import */ var _lib_navigation_resolve_internal_path__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @/lib/navigation/resolve-internal-path */ \"(middleware)/./lib/navigation/resolve-internal-path.ts\");\n/* harmony import */ var _lib_navigation_path_utils__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @/lib/navigation/path-utils */ \"(middleware)/./lib/navigation/path-utils.ts\");\n/* harmony import */ var _lib_navigation_rewrite_with_locale__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @/lib/navigation/rewrite-with-locale */ \"(middleware)/./lib/navigation/rewrite-with-locale.ts\");\n/* harmony import */ var _i18n_routing__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @/i18n/routing */ \"(middleware)/./i18n/routing.ts\");\n\n\n\n\n\n\n\nconst intlMiddleware = (0,next_intl_middleware__WEBPACK_IMPORTED_MODULE_6__[\"default\"])(_i18n_routing__WEBPACK_IMPORTED_MODULE_5__.routing);\nfunction isProtectedPath(pathWithoutLocaleValue) {\n    return _lib_navigation_app_routes__WEBPACK_IMPORTED_MODULE_1__.PROTECTED_APP_ROOTS.some((root)=>pathWithoutLocaleValue === `/${root}` || pathWithoutLocaleValue.startsWith(`/${root}/`));\n}\nfunction attachPathHeader(response, pathname) {\n    response.headers.set('x-pathname', pathname);\n    return response;\n}\nfunction proxy(request) {\n    const { pathname } = request.nextUrl;\n    const pathNoLocale = (0,_lib_navigation_path_utils__WEBPACK_IMPORTED_MODULE_3__.pathWithoutLocale)(pathname);\n    const sessionCookie = request.cookies.get('session');\n    if (isProtectedPath(pathNoLocale) && !sessionCookie) {\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.redirect(new URL('/sign-in', request.url));\n    }\n    const internalPath = (0,_lib_navigation_resolve_internal_path__WEBPACK_IMPORTED_MODULE_2__.resolveInternalAppPath)(pathname);\n    const response = internalPath ? (0,_lib_navigation_rewrite_with_locale__WEBPACK_IMPORTED_MODULE_4__.rewriteWithLocale)(request, internalPath) : intlMiddleware(request);\n    return attachPathHeader(response, pathname);\n}\nconst config = {\n    matcher: [\n        '/((?!api|_next/static|_next/image|favicon.ico|uploads|sounds).*)'\n    ]\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKG1pZGRsZXdhcmUpLy4vcHJveHkudHMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQXdEO0FBQ0o7QUFDYztBQUNjO0FBQ2hCO0FBQ1M7QUFDaEM7QUFFekMsTUFBTU8saUJBQWlCTixnRUFBZ0JBLENBQUNLLGtEQUFPQTtBQUUvQyxTQUFTRSxnQkFBZ0JDLHNCQUE4QjtJQUNyRCxPQUFPUCwyRUFBbUJBLENBQUNRLElBQUksQ0FDN0IsQ0FBQ0MsT0FDQ0YsMkJBQTJCLENBQUMsQ0FBQyxFQUFFRSxNQUFNLElBQ3JDRix1QkFBdUJHLFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRUQsS0FBSyxDQUFDLENBQUM7QUFFbkQ7QUFFQSxTQUFTRSxpQkFBaUJDLFFBQXNCLEVBQUVDLFFBQWdCO0lBQ2hFRCxTQUFTRSxPQUFPLENBQUNDLEdBQUcsQ0FBQyxjQUFjRjtJQUNuQyxPQUFPRDtBQUNUO0FBRU8sU0FBU0ksTUFBTUMsT0FBb0I7SUFDeEMsTUFBTSxFQUFFSixRQUFRLEVBQUUsR0FBR0ksUUFBUUMsT0FBTztJQUNwQyxNQUFNQyxlQUFlakIsNkVBQWlCQSxDQUFDVztJQUN2QyxNQUFNTyxnQkFBZ0JILFFBQVFJLE9BQU8sQ0FBQ0MsR0FBRyxDQUFDO0lBRTFDLElBQUloQixnQkFBZ0JhLGlCQUFpQixDQUFDQyxlQUFlO1FBQ25ELE9BQU90QixxREFBWUEsQ0FBQ3lCLFFBQVEsQ0FBQyxJQUFJQyxJQUFJLFlBQVlQLFFBQVFRLEdBQUc7SUFDOUQ7SUFFQSxNQUFNQyxlQUFlekIsNkZBQXNCQSxDQUFDWTtJQUM1QyxNQUFNRCxXQUFXYyxlQUNidkIsc0ZBQWlCQSxDQUFDYyxTQUFTUyxnQkFDM0JyQixlQUFlWTtJQUVuQixPQUFPTixpQkFBaUJDLFVBQVVDO0FBQ3BDO0FBRU8sTUFBTWMsU0FBUztJQUNwQkMsU0FBUztRQUFDO0tBQW1FO0FBQy9FLEVBQUUiLCJzb3VyY2VzIjpbIkQ6XFxCaGF2eWEgc3R1ZHlcXEJoYXZ5YSBzdHVkeSBkb2NzXFxMaXZlX1doYXRzYXBwX1Byb2plY3RcXHdoYXRzLXNhYXMtbWFpblxccHJveHkudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTmV4dFJlc3BvbnNlLCBOZXh0UmVxdWVzdCB9IGZyb20gJ25leHQvc2VydmVyJztcbmltcG9ydCBjcmVhdGVNaWRkbGV3YXJlIGZyb20gJ25leHQtaW50bC9taWRkbGV3YXJlJztcbmltcG9ydCB7IFBST1RFQ1RFRF9BUFBfUk9PVFMgfSBmcm9tICdAL2xpYi9uYXZpZ2F0aW9uL2FwcC1yb3V0ZXMnO1xuaW1wb3J0IHsgcmVzb2x2ZUludGVybmFsQXBwUGF0aCB9IGZyb20gJ0AvbGliL25hdmlnYXRpb24vcmVzb2x2ZS1pbnRlcm5hbC1wYXRoJztcbmltcG9ydCB7IHBhdGhXaXRob3V0TG9jYWxlIH0gZnJvbSAnQC9saWIvbmF2aWdhdGlvbi9wYXRoLXV0aWxzJztcbmltcG9ydCB7IHJld3JpdGVXaXRoTG9jYWxlIH0gZnJvbSAnQC9saWIvbmF2aWdhdGlvbi9yZXdyaXRlLXdpdGgtbG9jYWxlJztcbmltcG9ydCB7IHJvdXRpbmcgfSBmcm9tICdAL2kxOG4vcm91dGluZyc7XG5cbmNvbnN0IGludGxNaWRkbGV3YXJlID0gY3JlYXRlTWlkZGxld2FyZShyb3V0aW5nKTtcblxuZnVuY3Rpb24gaXNQcm90ZWN0ZWRQYXRoKHBhdGhXaXRob3V0TG9jYWxlVmFsdWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gUFJPVEVDVEVEX0FQUF9ST09UUy5zb21lKFxuICAgIChyb290KSA9PlxuICAgICAgcGF0aFdpdGhvdXRMb2NhbGVWYWx1ZSA9PT0gYC8ke3Jvb3R9YCB8fFxuICAgICAgcGF0aFdpdGhvdXRMb2NhbGVWYWx1ZS5zdGFydHNXaXRoKGAvJHtyb290fS9gKVxuICApO1xufVxuXG5mdW5jdGlvbiBhdHRhY2hQYXRoSGVhZGVyKHJlc3BvbnNlOiBOZXh0UmVzcG9uc2UsIHBhdGhuYW1lOiBzdHJpbmcpIHtcbiAgcmVzcG9uc2UuaGVhZGVycy5zZXQoJ3gtcGF0aG5hbWUnLCBwYXRobmFtZSk7XG4gIHJldHVybiByZXNwb25zZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHByb3h5KHJlcXVlc3Q6IE5leHRSZXF1ZXN0KSB7XG4gIGNvbnN0IHsgcGF0aG5hbWUgfSA9IHJlcXVlc3QubmV4dFVybDtcbiAgY29uc3QgcGF0aE5vTG9jYWxlID0gcGF0aFdpdGhvdXRMb2NhbGUocGF0aG5hbWUpO1xuICBjb25zdCBzZXNzaW9uQ29va2llID0gcmVxdWVzdC5jb29raWVzLmdldCgnc2Vzc2lvbicpO1xuXG4gIGlmIChpc1Byb3RlY3RlZFBhdGgocGF0aE5vTG9jYWxlKSAmJiAhc2Vzc2lvbkNvb2tpZSkge1xuICAgIHJldHVybiBOZXh0UmVzcG9uc2UucmVkaXJlY3QobmV3IFVSTCgnL3NpZ24taW4nLCByZXF1ZXN0LnVybCkpO1xuICB9XG5cbiAgY29uc3QgaW50ZXJuYWxQYXRoID0gcmVzb2x2ZUludGVybmFsQXBwUGF0aChwYXRobmFtZSk7XG4gIGNvbnN0IHJlc3BvbnNlID0gaW50ZXJuYWxQYXRoXG4gICAgPyByZXdyaXRlV2l0aExvY2FsZShyZXF1ZXN0LCBpbnRlcm5hbFBhdGgpXG4gICAgOiBpbnRsTWlkZGxld2FyZShyZXF1ZXN0KTtcblxuICByZXR1cm4gYXR0YWNoUGF0aEhlYWRlcihyZXNwb25zZSwgcGF0aG5hbWUpO1xufVxuXG5leHBvcnQgY29uc3QgY29uZmlnID0ge1xuICBtYXRjaGVyOiBbJy8oKD8hYXBpfF9uZXh0L3N0YXRpY3xfbmV4dC9pbWFnZXxmYXZpY29uLmljb3x1cGxvYWRzfHNvdW5kcykuKiknXSxcbn07XG4iXSwibmFtZXMiOlsiTmV4dFJlc3BvbnNlIiwiY3JlYXRlTWlkZGxld2FyZSIsIlBST1RFQ1RFRF9BUFBfUk9PVFMiLCJyZXNvbHZlSW50ZXJuYWxBcHBQYXRoIiwicGF0aFdpdGhvdXRMb2NhbGUiLCJyZXdyaXRlV2l0aExvY2FsZSIsInJvdXRpbmciLCJpbnRsTWlkZGxld2FyZSIsImlzUHJvdGVjdGVkUGF0aCIsInBhdGhXaXRob3V0TG9jYWxlVmFsdWUiLCJzb21lIiwicm9vdCIsInN0YXJ0c1dpdGgiLCJhdHRhY2hQYXRoSGVhZGVyIiwicmVzcG9uc2UiLCJwYXRobmFtZSIsImhlYWRlcnMiLCJzZXQiLCJwcm94eSIsInJlcXVlc3QiLCJuZXh0VXJsIiwicGF0aE5vTG9jYWxlIiwic2Vzc2lvbkNvb2tpZSIsImNvb2tpZXMiLCJnZXQiLCJyZWRpcmVjdCIsIlVSTCIsInVybCIsImludGVybmFsUGF0aCIsImNvbmZpZyIsIm1hdGNoZXIiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(middleware)/./proxy.ts\n");

/***/ }),

/***/ "../../server/app-render/action-async-storage.external":
/*!*******************************************************************************!*\
  !*** external "next/dist/server/app-render/action-async-storage.external.js" ***!
  \*******************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/action-async-storage.external.js");

/***/ }),

/***/ "../app-render/after-task-async-storage.external":
/*!***********************************************************************************!*\
  !*** external "next/dist/server/app-render/after-task-async-storage.external.js" ***!
  \***********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/after-task-async-storage.external.js");

/***/ }),

/***/ "../app-render/work-async-storage.external":
/*!*****************************************************************************!*\
  !*** external "next/dist/server/app-render/work-async-storage.external.js" ***!
  \*****************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-async-storage.external.js");

/***/ }),

/***/ "../app-render/work-unit-async-storage.external":
/*!**********************************************************************************!*\
  !*** external "next/dist/server/app-render/work-unit-async-storage.external.js" ***!
  \**********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-unit-async-storage.external.js");

/***/ }),

/***/ "./memory-cache.external":
/*!**********************************************************************************!*\
  !*** external "next/dist/server/lib/incremental-cache/memory-cache.external.js" ***!
  \**********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/lib/incremental-cache/memory-cache.external.js");

/***/ }),

/***/ "./shared-cache-controls.external":
/*!*******************************************************************************************!*\
  !*** external "next/dist/server/lib/incremental-cache/shared-cache-controls.external.js" ***!
  \*******************************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/lib/incremental-cache/shared-cache-controls.external.js");

/***/ }),

/***/ "./tags-manifest.external":
/*!***********************************************************************************!*\
  !*** external "next/dist/server/lib/incremental-cache/tags-manifest.external.js" ***!
  \***********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/lib/incremental-cache/tags-manifest.external.js");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("crypto");

/***/ }),

/***/ "next/dist/build/adapter/setup-node-env.external":
/*!******************************************************************!*\
  !*** external "next/dist/build/adapter/setup-node-env.external" ***!
  \******************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/build/adapter/setup-node-env.external");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "node:async_hooks":
/*!***********************************!*\
  !*** external "node:async_hooks" ***!
  \***********************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:async_hooks");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("./webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/@swc","vendor-chunks/next-intl","vendor-chunks/@formatjs","vendor-chunks/use-intl","vendor-chunks/intl-messageformat"], () => (__webpack_exec__("(middleware)/./node_modules/next/dist/build/webpack/loaders/next-middleware-loader.js?absolutePagePath=D%3A%5CBhavya%20study%5CBhavya%20study%20docs%5CLive_Whatsapp_Project%5Cwhats-saas-main%5Cproxy.ts&page=%2Fproxy&rootDir=D%3A%5CBhavya%20study%5CBhavya%20study%20docs%5CLive_Whatsapp_Project%5Cwhats-saas-main&matchers=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();