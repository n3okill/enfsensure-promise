/* global afterEach, beforeEach, describe, it, after, before */
/**
 * Created by JParreir on 06-10-2015.
 */


"use strict";

const nodePath = require("path");
const nodeOs = require("os");
const rimraf = require("rimraf");
const enfsmkdirp = require("enfsmkdirp");
const enFs = require("enfspatch-promise");
const ensure = require("../");
const cwd = process.cwd();
const ensureFileP = ensure.ensureFileP;
const ensureDirP = ensure.ensureDirP;


describe("enfsensure-promise create", function () {
    const tmpPath = nodePath.join(nodeOs.tmpdir(), "enfsensurecreate-promise");

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
        describe("> when the file and directory does not exist", function () {
            it("should create the file", function () {
                const file = nodePath.join(tmpPath, Math.random() + "test", Math.random() + ".txt");
                enFs.existStatSync(file).should.be.equal(false);
                return ensureFileP(file)
                    .then(() => enFs.statP(file))
                    .should.be.fulfilled(true);
            });
        });
        describe("> when the file does exist", function () {
            it("should not modify the file", function () {
                const file = nodePath.join(tmpPath, Math.random() + "test", Math.random() + ".txt");
                return ensureDirP(nodePath.dirname(file)).then(function () {
                    return enFs.writeFileP(file, "hello world!", "utf8")
                }).then(function () {
                    return ensureFileP(file);
                }).then(function () {
                    return enFs.readFileP(file, "utf8");
                }).should.be.fulfilled("hello world!");
            });
            it("should append to the file", function () {
                const file = nodePath.join(tmpPath, Math.random() + "test", Math.random() + ".txt");
                return ensureDirP(nodePath.dirname(file)).then(function () {
                    enFs.writeFileSync(file, "hello world!", "utf8");
                    return ensureFileP(file, {data: " new content", append: true});
                }).then(function () {
                    return enFs.readFileP(file, "utf8");
                }).should.be.fulfilled("hello world! new content");
            });
        });
    });
});
