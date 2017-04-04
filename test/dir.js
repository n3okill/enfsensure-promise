/**
 * Created by JParreir on 06-10-2015.
 */
/* global afterEach, beforeEach, describe, it, after, before, process */

"use strict";

const nodePath = require("path");
const nodeOs = require("os");
const rimraf = require("rimraf");
const enFs = require("enfspatch");
const enfsmkdirp = require("enfsmkdirp");
const ensure = require("../");
const cwd = process.cwd();
const ensureDirP = ensure.ensureDirP;


describe("enfsensure-promise directories", function () {
    const tmpPath = nodePath.join(nodeOs.tmpdir(), "enfsensuredir-promise");
    const _0777 = parseInt("0777", 8);
    const _0755 = parseInt("0755", 8);
    const _0744 = parseInt("0744", 8);
    const isWindows = /^win/.test(process.platform);

    before(function () {
        enfsmkdirp.mkdirpSync(tmpPath);
        process.chdir(tmpPath);
    });
    after(function () {
        process.chdir(cwd);
        rimraf.sync(tmpPath);
    });
    describe("> async", function () {
        it("should test ensureDir chmod", function () {
            const ps = [tmpPath];
            for (let i = 0; i < 2; i++) {
                ps.push(Math.floor(Math.random() * Math.pow(16, 4)).toString(16));
            }
            const file = ps.join(nodePath.sep);
            return ensureDirP(file, _0744).then(function () {
                const stat = enFs.statSync(file);
                stat.isDirectory().should.be.equal(true);
                if (!isWindows) {
                    (stat.mode & _0777).should.be.equal(_0744);
                }
                return ensureDirP(file, _0755);
            }).then(function () {
                const stat2 = enFs.statSync(file);
                stat2.isDirectory().should.be.equal(true);
                if (!isWindows) {
                    (stat2.mode & _0777).should.be.equal(_0755);
                    (stat2.mode & _0777).should.not.be.equal(_0744);
                }
            });
        });
    });
});
