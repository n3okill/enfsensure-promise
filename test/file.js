/* global afterEach, beforeEach, describe, it, after, before, process */
/**
 * Created by JParreir on 06-10-2015.
 */


"use strict";

const nodePath = require("path");
const nodeOs = require("os");
const rimraf = require("rimraf");
const enFs = require("enfspatch-promise");
const enfsmkdirp = require("enfsmkdirp");
const ensure = require("../");
const cwd = process.cwd();
const ensureFileP = ensure.ensureFileP;
const ensureDirP = ensure.ensureDirP;

describe("enfsensure files", function () {
    const tmpPath = nodePath.join(nodeOs.tmpdir(), "enfsensurefile");
    const _0777 = parseInt("0777", 8);
    const _0755 = parseInt("0755", 8);
    const _0744 = parseInt("0744", 8);
    const isWindows = /^win/.test(process.platform);

    before(function () {
        enfsmkdirp.mkdirpSync(tmpPath);
        process.chdir(tmpPath);
    });
    afterEach(function () {
        rimraf.sync(tmpPath + nodePath.sep + "*");
    });
    after(function () {
        process.chdir(cwd);
        rimraf.sync(tmpPath);
    });
    describe("> async", function () {
        it("should test ensureFile chmod", function () {
            const file = nodePath.join(tmpPath, "file1");
            return ensureFileP(file, _0744).then(function () {
                const stat = enFs.statSync(file);
                stat.isFile().should.be.equal(true);
                if (!isWindows) {
                    (stat.mode & _0777).should.be.equal(_0744);
                }
                return ensureFileP(file, _0755);
            }).then(function () {
                const stat2 = enFs.statSync(file);
                stat2.isFile().should.be.equal(true);
                if (!isWindows) {
                    (stat2.mode & _0777).should.be.equal(_0755);
                    (stat2.mode & _0777).should.not.be.equal(_0744);
                }
            });
        });
        it("should test ensureFile with content", function () {
            const data = "This will be written to the file";
            const file = nodePath.join(tmpPath, "fileContent");
            return ensureFileP(file, {data: data}).then(function () {
                enFs.statSync(file).isFile().should.be.equal(true);
                enFs.readFileSync(file, "utf8").should.be.equal(data);
            });
        });
        it("should test ensureFile and fail to create file", function () {
            const file = nodePath.join(tmpPath, "fileFolder");
            return ensureDirP(file).then(function () {
                return ensureFileP(file, _0755);
            }).catch(function (err) {
                (err === null).should.be.equal(false);
                err.message.should.containEql("Item already exists and is not a file");
                enFs.statSync(file).isDirectory().should.be.equal(true);
            });
        });
        it("should not modify the file", function () {
            const file = nodePath.join(tmpPath, "notModify", "file.txt");
            return ensureDirP(nodePath.dirname(file)).then(function () {
                enFs.writeFileSync(file, "hello world");
                return ensureFileP(file);
            }).then(function () {
                enFs.readFileSync(file, "utf8").should.be.equal("hello world");
            });
        });
    });
});
