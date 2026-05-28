"use strict";
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
exports.id = "instrumentation";
exports.ids = ["instrumentation"];
exports.modules = {

/***/ "(instrument)/./instrumentation.ts":
/*!****************************!*\
  !*** ./instrumentation.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   register: () => (/* binding */ register)\n/* harmony export */ });\nasync function register() {\n    if (true) {\n        const { validateEnv } = await Promise.all(/*! import() */[__webpack_require__.e(\"vendor-chunks/zod\"), __webpack_require__.e(\"_instrument_lib_env_ts\")]).then(__webpack_require__.bind(__webpack_require__, /*! @/lib/env */ \"(instrument)/./lib/env.ts\"));\n        const { validateRateLimitConfig } = await Promise.all(/*! import() */[__webpack_require__.e(\"vendor-chunks/zod\"), __webpack_require__.e(\"vendor-chunks/ioredis\"), __webpack_require__.e(\"vendor-chunks/next\"), __webpack_require__.e(\"vendor-chunks/@ioredis\"), __webpack_require__.e(\"vendor-chunks/redis-parser\"), __webpack_require__.e(\"vendor-chunks/denque\"), __webpack_require__.e(\"vendor-chunks/cluster-key-slot\"), __webpack_require__.e(\"vendor-chunks/redis-errors\"), __webpack_require__.e(\"vendor-chunks/supports-color\"), __webpack_require__.e(\"vendor-chunks/standard-as-callback\"), __webpack_require__.e(\"vendor-chunks/has-flag\"), __webpack_require__.e(\"_instrument_lib_rate-limit_ts\")]).then(__webpack_require__.bind(__webpack_require__, /*! @/lib/rate-limit */ \"(instrument)/./lib/rate-limit.ts\"));\n        try {\n            validateEnv();\n            validateRateLimitConfig();\n        } catch (e) {\n            console.error('[instrumentation] env validation failed', e);\n        }\n        const shutdown = async (signal)=>{\n            console.log(`[shutdown] ${signal} received`);\n            try {\n                const { getRedis } = await Promise.all(/*! import() */[__webpack_require__.e(\"vendor-chunks/ioredis\"), __webpack_require__.e(\"vendor-chunks/next\"), __webpack_require__.e(\"vendor-chunks/@ioredis\"), __webpack_require__.e(\"vendor-chunks/redis-parser\"), __webpack_require__.e(\"vendor-chunks/denque\"), __webpack_require__.e(\"vendor-chunks/cluster-key-slot\"), __webpack_require__.e(\"vendor-chunks/redis-errors\"), __webpack_require__.e(\"vendor-chunks/supports-color\"), __webpack_require__.e(\"vendor-chunks/standard-as-callback\"), __webpack_require__.e(\"vendor-chunks/has-flag\"), __webpack_require__.e(\"_instrument_lib_redis_ts\")]).then(__webpack_require__.bind(__webpack_require__, /*! @/lib/redis */ \"(instrument)/./lib/redis.ts\"));\n                const redis = getRedis();\n                if (redis) await redis.quit();\n            } catch  {\n            /* ignore */ }\n            process.exit(0);\n        };\n        process.on('SIGTERM', ()=>void shutdown('SIGTERM'));\n        process.on('SIGINT', ()=>void shutdown('SIGINT'));\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKGluc3RydW1lbnQpLy4vaW5zdHJ1bWVudGF0aW9uLnRzIiwibWFwcGluZ3MiOiI7Ozs7QUFBTyxlQUFlQTtJQUNwQixJQUFJQyxJQUFxQyxFQUFFO1FBQ3pDLE1BQU0sRUFBRUcsV0FBVyxFQUFFLEdBQUcsTUFBTSwyTkFBbUI7UUFDakQsTUFBTSxFQUFFQyx1QkFBdUIsRUFBRSxHQUFHLE1BQU0scXZCQUEwQjtRQUNwRSxJQUFJO1lBQ0ZEO1lBQ0FDO1FBQ0YsRUFBRSxPQUFPQyxHQUFHO1lBQ1ZDLFFBQVFDLEtBQUssQ0FBQywyQ0FBMkNGO1FBQzNEO1FBRUEsTUFBTUcsV0FBVyxPQUFPQztZQUN0QkgsUUFBUUksR0FBRyxDQUFDLENBQUMsV0FBVyxFQUFFRCxPQUFPLFNBQVMsQ0FBQztZQUMzQyxJQUFJO2dCQUNGLE1BQU0sRUFBRUUsUUFBUSxFQUFFLEdBQUcsTUFBTSwwckJBQXFCO2dCQUNoRCxNQUFNQyxRQUFRRDtnQkFDZCxJQUFJQyxPQUFPLE1BQU1BLE1BQU1DLElBQUk7WUFDN0IsRUFBRSxPQUFNO1lBQ04sVUFBVSxHQUNaO1lBQ0FiLFFBQVFjLElBQUksQ0FBQztRQUNmO1FBRUFkLFFBQVFlLEVBQUUsQ0FBQyxXQUFXLElBQU0sS0FBS1AsU0FBUztRQUMxQ1IsUUFBUWUsRUFBRSxDQUFDLFVBQVUsSUFBTSxLQUFLUCxTQUFTO0lBQzNDO0FBQ0YiLCJzb3VyY2VzIjpbIkQ6XFxCaGF2eWEgc3R1ZHlcXEJoYXZ5YSBzdHVkeSBkb2NzXFxMaXZlX1doYXRzYXBwX1Byb2plY3RcXHdoYXRzLXNhYXMtbWFpblxcaW5zdHJ1bWVudGF0aW9uLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBhc3luYyBmdW5jdGlvbiByZWdpc3RlcigpIHtcbiAgaWYgKHByb2Nlc3MuZW52Lk5FWFRfUlVOVElNRSA9PT0gJ25vZGVqcycpIHtcbiAgICBjb25zdCB7IHZhbGlkYXRlRW52IH0gPSBhd2FpdCBpbXBvcnQoJ0AvbGliL2VudicpO1xuICAgIGNvbnN0IHsgdmFsaWRhdGVSYXRlTGltaXRDb25maWcgfSA9IGF3YWl0IGltcG9ydCgnQC9saWIvcmF0ZS1saW1pdCcpO1xuICAgIHRyeSB7XG4gICAgICB2YWxpZGF0ZUVudigpO1xuICAgICAgdmFsaWRhdGVSYXRlTGltaXRDb25maWcoKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdbaW5zdHJ1bWVudGF0aW9uXSBlbnYgdmFsaWRhdGlvbiBmYWlsZWQnLCBlKTtcbiAgICB9XG5cbiAgICBjb25zdCBzaHV0ZG93biA9IGFzeW5jIChzaWduYWw6IHN0cmluZykgPT4ge1xuICAgICAgY29uc29sZS5sb2coYFtzaHV0ZG93bl0gJHtzaWduYWx9IHJlY2VpdmVkYCk7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCB7IGdldFJlZGlzIH0gPSBhd2FpdCBpbXBvcnQoJ0AvbGliL3JlZGlzJyk7XG4gICAgICAgIGNvbnN0IHJlZGlzID0gZ2V0UmVkaXMoKTtcbiAgICAgICAgaWYgKHJlZGlzKSBhd2FpdCByZWRpcy5xdWl0KCk7XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgLyogaWdub3JlICovXG4gICAgICB9XG4gICAgICBwcm9jZXNzLmV4aXQoMCk7XG4gICAgfTtcblxuICAgIHByb2Nlc3Mub24oJ1NJR1RFUk0nLCAoKSA9PiB2b2lkIHNodXRkb3duKCdTSUdURVJNJykpO1xuICAgIHByb2Nlc3Mub24oJ1NJR0lOVCcsICgpID0+IHZvaWQgc2h1dGRvd24oJ1NJR0lOVCcpKTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbInJlZ2lzdGVyIiwicHJvY2VzcyIsImVudiIsIk5FWFRfUlVOVElNRSIsInZhbGlkYXRlRW52IiwidmFsaWRhdGVSYXRlTGltaXRDb25maWciLCJlIiwiY29uc29sZSIsImVycm9yIiwic2h1dGRvd24iLCJzaWduYWwiLCJsb2ciLCJnZXRSZWRpcyIsInJlZGlzIiwicXVpdCIsImV4aXQiLCJvbiJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(instrument)/./instrumentation.ts\n");

/***/ }),

/***/ "../app-render/after-task-async-storage.external":
/*!***********************************************************************************!*\
  !*** external "next/dist/server/app-render/after-task-async-storage.external.js" ***!
  \***********************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/server/app-render/after-task-async-storage.external.js");

/***/ }),

/***/ "../app-render/work-async-storage.external":
/*!*****************************************************************************!*\
  !*** external "next/dist/server/app-render/work-async-storage.external.js" ***!
  \*****************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/server/app-render/work-async-storage.external.js");

/***/ }),

/***/ "../app-render/work-unit-async-storage.external":
/*!**********************************************************************************!*\
  !*** external "next/dist/server/app-render/work-unit-async-storage.external.js" ***!
  \**********************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/server/app-render/work-unit-async-storage.external.js");

/***/ }),

/***/ "assert":
/*!*************************!*\
  !*** external "assert" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("assert");

/***/ }),

/***/ "buffer":
/*!*************************!*\
  !*** external "buffer" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("buffer");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),

/***/ "dns":
/*!**********************!*\
  !*** external "dns" ***!
  \**********************/
/***/ ((module) => {

module.exports = require("dns");

/***/ }),

/***/ "events":
/*!*************************!*\
  !*** external "events" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("events");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/***/ ((module) => {

module.exports = require("fs");

/***/ }),

/***/ "net":
/*!**********************!*\
  !*** external "net" ***!
  \**********************/
/***/ ((module) => {

module.exports = require("net");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "node:diagnostics_channel":
/*!*******************************************!*\
  !*** external "node:diagnostics_channel" ***!
  \*******************************************/
/***/ ((module) => {

module.exports = require("node:diagnostics_channel");

/***/ }),

/***/ "os":
/*!*********************!*\
  !*** external "os" ***!
  \*********************/
/***/ ((module) => {

module.exports = require("os");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("path");

/***/ }),

/***/ "stream":
/*!*************************!*\
  !*** external "stream" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("stream");

/***/ }),

/***/ "string_decoder":
/*!*********************************!*\
  !*** external "string_decoder" ***!
  \*********************************/
/***/ ((module) => {

module.exports = require("string_decoder");

/***/ }),

/***/ "tls":
/*!**********************!*\
  !*** external "tls" ***!
  \**********************/
/***/ ((module) => {

module.exports = require("tls");

/***/ }),

/***/ "tty":
/*!**********************!*\
  !*** external "tty" ***!
  \**********************/
/***/ ((module) => {

module.exports = require("tty");

/***/ }),

/***/ "util":
/*!***********************!*\
  !*** external "util" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("util");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("./webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = (__webpack_exec__("(instrument)/./instrumentation.ts"));
module.exports = __webpack_exports__;

})();