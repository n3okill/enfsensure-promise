/* global afterEach, beforeEach, describe, it, after, before, process */
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
const ensureSymlink = ensure.ensureSymlinkP;
const ensureSymlinkPaths = require("./symlinkPathsAsyncTest");
const UtilLink = require("./utilLink");


describe("enfsensure symlink", function () {
    const tmpPath = nodePath.join(nodeOs.tmpdir(), "enfsensuresymlink");
    const isWindows = /^win/.test(process.platform);
    const tests = [
        {src: "./foo.txt", dst: "./symlink.txt", fs: "file-success", ensure: "file-success"},
        {src: "../foo.txt", dst: "./empty-dir/symlink.txt", fs: "file-success", ensure: "file-success"},
        {src: "./foo.txt", dst: "./dir-foo/symlink.txt", fs: "file-success", ensure: "file-success"},
        {src: "./foo.txt", dst: "./empty-dir/symlink.txt", fs: "file-broken", ensure: "file-success"},
        {src: "./foo.txt", dst: "./real-alpha/symlink.txt", fs: "file-broken", ensure: "file-success"},
        {src: "./foo.txt", dst: "./real-alpha/real-beta/symlink.txt", fs: "file-broken", ensure: "file-success"},
        {
            src: "./foo.txt",
            dst: "./real-alpha/real-beta/real-gamma/symlink.txt",
            fs: "file-broken",
            ensure: "file-success"
        },
        {src: "./foo.txt", dst: "./alpha/symlink.txt", fs: "file-error", ensure: "file-success"},
        {src: "./foo.txt", dst: "./alpha/beta/symlink.txt", fs: "file-error", ensure: "file-success"},
        {src: "./foo.txt", dst: "./alpha/beta/gamma/symlink.txt", fs: "file-error", ensure: "file-success"},
        {src: "./missing.txt", dst: "./symlink.txt", fs: "file-broken", ensure: "file-error"},
        {src: "./missing.txt", dst: "./missing-dir/symlink.txt", fs: "file-error", ensure: "file-error"},
        {src: "./foo.txt", dst: "./dir-foo/foo.txt", fs: "file-error", ensure: "file-dst-exists"},
        {src: "./dir-foo", dst: "./symlink-dir-foo", fs: "dir-success", ensure: "dir-success"},
        {src: "./dir-bar", dst: "./dir-foo/symlink-dir-bar", fs: "dir-broken", ensure: "dir-success"},
        {src: "./dir-bar", dst: "./empty-dir/symlink-dir-bar", fs: "dir-broken", ensure: "dir-success"},
        {src: "./dir-bar", dst: "./real-alpha/symlink-dir-bar", fs: "dir-broken", ensure: "dir-success"},
        {src: "./dir-bar", dst: "./real-alpha/real-beta/symlink-dir-bar", fs: "dir-broken", ensure: "dir-success"},
        {
            src: "./dir-bar",
            dst: "./real-alpha/real-beta/real-gamma/symlink-dir-bar",
            fs: "dir-broken",
            ensure: "dir-success"
        },
        {src: "./dir-foo", dst: "./alpha/dir-foo", fs: "dir-error", ensure: "dir-success"},
        {src: "./dir-foo", dst: "./alpha/beta/dir-foo", fs: "dir-error", ensure: "dir-success"},
        {src: "./missing", dst: "./dir-foo/symlink-dir-missing", fs: "dir-broken", ensure: "dir-error"},
        {src: "./dir-foo", dst: "./real-alpha/real-beta", fs: "dir-error", ensure: "dir-dst-exists"}
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
            super.execute(`should create a symlink file using '${this.src}' and dst '${this.dst}'`);
        }

        result(err) {
            if (err && err.code === "EPERM" && isWindows) {
                return;
            }
            let srcContent, stat, dstContent;
            (err === null).should.be.equal(true);
            return ensureSymlinkPaths(this.src, this.dst)
                .then(function (relative) {
                    return enFs.readFileP(relative.toCwd, "utf8")
                }).then(function (srcContent_) {
                    srcContent = srcContent_;
                    return enFs.lstatP(this.dst);
                }).then(function (stat_) {
                    stat = stat_;
                    return enFs.readFileP(this.dst, "utf8");
                }).then(function (dstContent_) {
                    dstContent = dstContent_;
                    return enFs.readdirP(nodePath.dirname(this.dst));
                }).then(function (dstDirContent) {
                    stat.isSymbolicLink().should.be.equal(true);
                    srcContent.should.be.equal(dstContent);
                    dstDirContent.indexOf(nodePath.basename(this.dst)).should.be.greaterThanOrEqual(0);
                });
        }
    }

    class FileError extends UtilLink.FileError {
        constructor(src, dst, fn, type) {
            super(src, dst, fn, type);
        }

        execute() {
            super.execute(`should return error when creating symlink file using src '${this.src}' and dst '${this.dst}'`);
        }

        result(err) {
            if (err && err.code === "EPERM" && isWindows) {
                return;
            }
            err.should.be.instanceOf(Error);
            //ensure that directories aren't created if there's an error
            return enFs.statP(nodePath.dirname(this.dst)).then(function (statAfter) {
                if (typeof this.statBefore === "undefined") {
                    (typeof statAfter === "undefined").should.be.equal(true);
                    return;
                }
                this.statBefore.isDirectory().should.be.equal(statAfter.isDirectory());
            }).catch((err) => err.should.be.instanceOf(Error));
        }
    }

    class FileDstExists extends UtilLink.FileDstExists {
        constructor(src, dst, fn, type) {
            super(src, dst, fn, type);
            this.contentBefore = null;
        }

        execute() {
            super.execute(`should do nothing using src '${this.src}' and dst '${this.dst}'`);
        }

        result(err) {
            if (err && err.code === "EPERM" && isWindows) {
                return;
            }
            (err === null || typeof err === "undefined").should.be.equal(true);
            return enFs.readFileP(this.dst, "utf8").then((contentAfter) => {
                this.contentBefore.should.be.equal(contentAfter);
            });
        }
    }

    class DirSuccess extends UtilLink.Test {
        constructor(src, dst, fn, type) {
            super(src, dst, fn, type);
        }

        execute() {
            it("should create symlink dir using src '" + this.src + "' and dst '" + this.dst + "'", () => {
                return super.execute();
            });
        }

        result(err) {
            if (err && err.code === "EPERM" && isWindows) {
                return;
            }
            (err === null || typeof err === "undefined").should.be.equal(true);
            let stat, srcContent, dstContent;
            return ensureSymlinkPaths(this.src, this.dst).then(function (relative) {
                return enFs.readdirP(relative.toCwd);
            }).then(function (srcContent_) {
                srcContent = srcContent_;
                return enFs.lstatP(this.dst);
            }).then(function (stat_) {
                stat = stat_;
                return enFs.readdirP(this.dst);
            }).then(function (dstContent_) {
                dstContent = dstContent_;
                return enFs.readdirP(nodePath.dirname(this.dst));
            }).then(function (dstDirContent) {
                stat.isSymbolicLink().should.be.equal(true);
                srcContent.should.be.eql(dstContent);
                dstDirContent.indexOf(nodePath.basename(this.dst)).should.be.greaterThanOrEqual(0);
            });
        }
    }

    class DirError extends UtilLink.Test {
        constructor(src, dst, fn, type) {
            super(src, dst, fn, type);
        }

        execute() {
            let execute = super.execute;
            let self = this;
            it("should return error when creating symlink dir using src '" + this.src + "' and dst '" + this.dst + "'", () => {
                return enFs.statP(nodePath.dirname(this.dst)).then(function (stat) {
                    self.statBefore = stat;
                    return execute.call(self);
                }).catch((err) => execute.call(self));
            });
        }

        result(err) {
            if (err && err.code === "EPERM" && isWindows) {
                return;
            }
            err.should.be.instanceOf(Error);
            //ensure that directories aren't created if there's an error
            return enFs.statP(nodePath.dirname(this.dst)).then(function (statAfter) {
                if (typeof this.statBefore === "undefined") {
                    (typeof statAfter === "undefined").should.be.equal(true);
                    return;
                }
                this.statBefore.isDirectory().should.be.equal(statAfter.isDirectory());
            }).catch((err) => err.should.be.instanceOf(Error));
        }
    }

    class DirDstExists extends UtilLink.Test {
        constructor(src, dst, fn, type) {
            super(src, dst, fn, type);
        }

        execute() {
            let execute = super.execute;
            let self = this;
            it("should do nothing using src '" + this.src + "' and dst '" + this.dst + "'", () => {
                return enFs.readdirP(this.dst).then(function (contentBefore) {
                    self.contentBefore = contentBefore;
                    return execute.call(self);
                }).catch((err) => execute.call(self));
            });
        }

        result(err) {
            if (err && err.code === "EPERM" && isWindows) {
                return;
            }
            (err === null || typeof err === "undefined").should.be.equal(true);
            return enFs.readdirP(this.dst).then((contentAfter) => {
                this.contentBefore.should.be.eql(contentAfter);
            });
        }
    }


    describe("> async", function () {
        describe("> ensureSymlink()", function () {
            let pros = [];
            tests.forEach(function (test) {
                switch (test.ensure) {
                    case "file-success":
                        pros.push((new FileSuccess(test.src, test.dst, ensureSymlink, "async")).execute());
                        break;
                    case "file-error":
                        pros.push((new FileError(test.src, test.dst, ensureSymlink, "async")).execute());
                        break;
                    case "file-dst-exists":
                        pros.push((new FileDstExists(test.src, test.dst, ensureSymlink, "async")).execute());
                        break;
                    case "dir-success":
                        pros.push((new DirSuccess(test.src, test.dst, ensureSymlink, "async")).execute());
                        break;
                    case "dir-error":
                        pros.push((new DirError(test.src, test.dst, ensureSymlink, "async")).execute());
                        break;
                    case "dir-dst-exists":
                        pros.push((new DirDstExists(test.src, test.dst, ensureSymlink, "async")).execute());
                        break;
                    default:
                        throw new Error("Invalid option '" + test.fs + "'");
                }
            });
            return Promise.all(pros).should.be.fulfilled();
        });
    });
});
