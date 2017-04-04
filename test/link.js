/* global afterEach, beforeEach, describe, it, after, before */
/**
 * Created by n3okill on 31-10-2015.
 */


"use strict";

const nodePath = require("path");
const nodeOs = require("os");
const cwd = process.cwd();
const rimraf = require("rimraf");
const enFs = require("enfspatch-promise");
const enfsmkdirp = require("enfsmkdirp");
const ensure = require("../");
const ensureLinkP = ensure.ensureLinkP;
const UtilLink = require("./utilLink");


describe("enfsensure-promise link", function () {
    const tmpPath = nodePath.join(nodeOs.tmpdir(), "enfsensurelink-promise");

    const tests = [
        {src: "./foo.txt", dst: "./link.txt", fs: "file-success", ensure: "file-success"},
        {src: "./foo.txt", dst: "./dir-foo/link.txt", fs: "file-success", ensure: "file-success"},
        {src: "./foo.txt", dst: "./empty-dir/link.txt", fs: "file-success", ensure: "file-success"},
        {src: "./foo.txt", dst: "./real-alpha/link.txt", fs: "file-success", ensure: "file-success"},
        {src: "./foo.txt", dst: "./real-alpha/real-beta/link.txt", fs: "file-success", ensure: "file-success"},
        {
            src: "./foo.txt",
            dst: "./real-alpha/real-beta/real-gamma/link.txt",
            fs: "file-success",
            ensure: "file-success"
        },
        {src: "./foo.txt", dst: "./alpha/link.txt", fs: "file-error", ensure: "file-success"},
        {src: "./foo.txt", dst: "./alpha/beta/link.txt", fs: "file-error", ensure: "file-success"},
        {src: "./foo.txt", dst: "./alpha/beta/gamma/link.txt", fs: "file-error", ensure: "file-success"},
        {src: "./missing.txt", dst: "./link.txt", fs: "file-error", ensure: "file-error"},
        {src: "./missing.txt", dst: "./missing-dir/link.txt", fs: "file-error", ensure: "file-error"},
        {src: "./foo.txt", dst: "./link.txt", fs: "file-success", ensure: "file-success"},
        {src: "./dir-foo/foo.txt", dst: "./link.txt", fs: "file-success", ensure: "file-success"},
        {src: "./missing.txt", dst: "./link.txt", fs: "file-error", ensure: "file-error"},
        {src: "../foo.txt", dst: "./link.txt", fs: "file-error", ensure: "file-error"},
        {src: "../dir-foo/foo.txt", dst: "./link.txt", fs: "file-error", ensure: "file-error"},
        // error is thrown if destination path exists
        {src: "./foo.txt", dst: "./dir-foo/foo.txt", fs: "file-error", ensure: "file-dst-exists"}
    ];

    before(function () {
        enfsmkdirp.mkdirpSync(tmpPath);
        process.chdir(tmpPath);
    });
    after(function () {
        process.chdir(cwd);
        rimraf.sync(tmpPath);
    });

    beforeEach(function () {
        enFs.writeFileSync(nodePath.join(tmpPath, "foo.txt"), "foo\n");
        ensure.ensureDirSync(nodePath.join(tmpPath, "empty-dir"));
        ensure.ensureFileSync(nodePath.join(tmpPath, "dir-foo", "foo.txt"), {data: "dir-foo\n"});
        ensure.ensureFileSync(nodePath.join(tmpPath, "dir-bar", "bar.txt"), {data: "dir-bar\n"});
        ensure.ensureDirSync(nodePath.join(tmpPath, "real-alpha", "real-beta", "real-gamma"));
    });
    afterEach(function (done) {
        rimraf(tmpPath + nodePath.sep + "*", done);
    });

    class FileSuccess extends UtilLink.FileSuccess {
        constructor(src, dst, fn, type) {
            super(src, dst, fn, type);
        }

        execute() {
            super.execute(`should create link file using '${this.src}' and dst '${this.dst}'`);
        }

        result() {
            return enFs.readFileP(this.src, "utf8").then((srcContent) => {
                const dstDir = nodePath.dirname(this.dst);
                const dstBasename = nodePath.basename(this.dst);
                enFs.lstatSync(this.dst).isFile().should.be.equal(true);
                enFs.readFileSync(this.dst, "utf8").should.be.equal(srcContent);
                enFs.readdirSync(dstDir).indexOf(dstBasename).should.be.greaterThanOrEqual(0);
            });
        }
    }

    class FileError extends UtilLink.FileError {
        constructor(src, dst, fn, type) {
            super(src, dst, fn, type);
        }

        execute() {
            super.execute(`should throw error using '${this.src}' and dst '${this.dst}'`);
        }

        result(err) {
            err.should.be.instanceOf(Error);
            //ensure that directories aren't created if there's an error
            return enFs.statP(nodePath.dirname(this.dst)).then((statAfter) => {
                if (typeof this.statBefore === "undefined") {
                    (typeof statAfter === "undefined").should.be.equal(true);
                    return;
                }
                this.statBefore.isDirectory().should.be.equal(statAfter.isDirectory());
            }).catch(function (err) {
                err.should.be.instanceOf(Error);
            });
        }
    }

    class FileDstExists extends UtilLink.FileDstExists {
        constructor(src, dst, fn, type) {
            super(src, dst, fn, type);
        }

        execute() {
            super.execute(`should do nothing using src '${this.src}' and dst '${this.dst}'`);
        }

        result() {
            return enFs.readFileP(this.dst, "utf8").then((contentAfter) => {
                this.contentBefore.should.be.equal(contentAfter);
            });
        }
    }

    describe("> async", function () {
        describe("> ensureLink()", function () {
            let pros = [];
            tests.forEach(function (test) {
                switch (test.ensure) {
                    case "file-success":
                        pros.push((new FileSuccess(test.src, test.dst, ensureLinkP, "async")).execute());
                        break;
                    case "file-error":
                        pros.push((new FileError(test.src, test.dst, ensureLinkP, "async")).execute());
                        break;
                    case "file-dst-exists":
                        pros.push((new FileDstExists(test.src, test.dst, ensureLinkP, "async")).execute());
                        break;
                    default:
                        throw new Error("Invalid option '" + test.ensure + "'");
                }
            });
            return Promise.all(pros).should.be.fulfilled();
        });
    });
});

