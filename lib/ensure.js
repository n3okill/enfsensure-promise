/**
 * @project enfsensure
 * @filename ensure.js
 * @description entry point for enfsensure module
 * @author Joao Parreira <joaofrparreira@gmail.com>
 * @copyright Copyright(c) 2016 Joao Parreira <joaofrparreira@gmail.com>
 * @licence Creative Commons Attribution 4.0 International License
 * @createdAt Created at 18-02-2016.
 * @version 0.0.1
 */


"use strict";

const enfsensure = require("enfsensure");

module.exports = enfsensure;

["ensureFile", "ensureDir"].forEach((name) => {
    if(name in enfsensure) {
        module.exports[`${name}P`] = function (path, opt) {
            return new Promise((resolve, reject) => enfsensure[name](path, opt, (err, res) => err ? reject(err) : resolve(res)));
        }
    }
});
["ensureLink", "ensureSymlink"].forEach((name) => {
    if(name in enfsensure) {
        module.exports[`${name}P`] = function (srcPath, dstPath, opt) {
            return new Promise((resolve, reject) => enfsensure[name](srcPath, dstPath, opt, (err, res) => err ? reject(err) : resolve(res)));
        }
    }
});
