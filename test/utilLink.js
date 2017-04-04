/**
 * @project enf
 * @filename utilSymlink.js
 * @author Joao Parreira <joaofrparreira@gmail.com>
 * @copyright Copyright(c) 2017 Joao Parreira <joaofrparreira@gmail.com>
 * @licence Creative Commons Attribution 4.0 International License
 * @createdAt Created at 20-02-2017
 * @version 0.0.1
 * @description
 */

/* global it*/

"use strict";

const nodePath = require("path");
const enFs = require("enfspatch-promise");

class Test {
    constructor(src, dst, fn, type) {
        this.src = src;
        this.dst = dst;
        this.fn = fn;
        this.type = type;
    }

    execute() {
        const self = this;
        return self.fn(self.src, self.dst).then(() => self.result()).catch((err) => self.result(err));
    }
}

class FileSuccess extends Test {
    constructor(src, dst, fn, type) {
        super(src, dst, fn, type);
    }

    execute(msg) {
        it(msg, () => {
            return super.execute();
        });
    }
}


class FileError extends Test {
    constructor(src, dst, fn, type) {
        super(src, dst, fn, type);
        this.statBefore = null;
    }

    execute(msg) {
        let execute = super.execute;
        let self = this;
        it(msg, () => {
            return enFs.statP(nodePath.dirname(this.dst)).then((stat) => {
                self.statBefore = stat;
                return execute.call(self);
            }).catch(() => {
                return execute.call(self);
            });
        });
    }
}

class FileDstExists extends Test {
    constructor(src, dst, fn, type) {
        super(src, dst, fn, type);
        this.contentBefore = null;
    }

    execute(msg) {
        let execute = super.execute;
        let self = this;
        it(msg, () => {
            return enFs.readFileP(this.dst, "utf8").then((contentBefore) => {
                self.contentBefore = contentBefore;
                return execute.call(self);
            });
        });
    }
}

class FileBroken extends Test {
    constructor(src, dst, fn, type) {
        super(src, dst, fn, type);
    }

    execute(msg) {
        it(msg, (done) => {
            super.execute(done);
        });
    }
}

class DirSuccess extends Test {
    constructor(src, dst, fn, type) {
        super(src, dst, fn, type);
    }
}

class DirBroken extends Test {
    constructor(src, dst, fn, type) {
        super(src, dst, fn, type);
    }
}

class DirError extends Test {
    constructor(src, dst, fn, type) {
        super(src, dst, fn, type);
    }
}

class DirDstExists extends Test {
    constructor(src, dst, fn, type) {
        super(src, dst, fn, type);
    }
}

module.exports = {
    Test,
    FileSuccess,
    FileError,
    FileDstExists,
    FileBroken,
    DirSuccess,
    DirBroken,
    DirError,
    DirDstExists
};