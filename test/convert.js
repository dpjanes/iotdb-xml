/**
 *  test/initialize.js
 *
 *  David Janes
 *  IOTDB
 *  2020-02-19
 *
 *  Copyright (2013-2020) David P. Janes
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

"use strict"

const _ = require("iotdb-helpers")
const fs = require("iotdb-fs")
const xml = require("..")

const assert = require("assert")
const path = require("path")

const _util = require("./_util")

const WRITE = true
const LOG = true

/**
 */
const _path_in = (...rest) => _.promise(self => {
    self.path = path.join(__dirname, "data", "in", ...rest)
})

/**
 */
const _read_in = _name => _.promise((self, done) => {
    _.promise(self)
        .validate(_read_in)

        .then(_path_in(_name))
        .then(fs.read.utf8)

        .end(done, self, "document")
})
_read_in.method = "_read_in"
_read_in.requires = {
}

/**
 */
const _path_result = (...rest) => _.promise(self => {
    self.path = path.join(__dirname, "data", "out", ...rest)
})

/**
 */
const _write_result = _name => _.promise((self, done) => {
    _.promise(self)
        .validate(_write_result)

        .then(_path_result(_name))
        .add("json$expanded", true)
        .then(fs.make.directory.parent)
        .then(fs.write.json)

        .end(done, self)
})
_write_result.method = "_write_result"
_write_result.requires = {
    json: _.is.Dictionary,
}

/**
 */
const _read_result = _name => _.promise((self, done) => {
    _.promise(self)
        .validate(_read_result)

        .then(_path_result(_name))
        .then(fs.read.json.magic)

        .end(done, self, "json:want")
})
_read_result.method = "_read_result"
_read_result.requires = {
}

/**
 */
const _log_result = _name => _.promise(self => {
    console.log("+", _name, JSON.stringify(self.json, null, 2))
})
_log_result.method = "_log_result"
_log_result.requires = {
    json: _.is.JSON,
}


describe("initialize", function() {
    let self = {}

    before(function(done) {
        _.promise(self)
            .make(sd => {
                self = sd
            })
            .end(done)
    })

    describe("good", function() {
        it("sample-1", function(done) {
            const name = "sample-1"

            _.promise(self)
                .then(_read_in(`${name}.xml`))
                .then(xml.convert)
                .conditional(true, _write_result(`${name}.json`))
                .conditional(LOG, _log_result(`${name}.xml`))
                .then(_read_result(`${name}.json`))
                .make(sd => {
                    sd.got = sd.json
                    assert.deepEqual(sd.got, sd.want)
                })
                .end(done, {})
        })
        if (0) it("sample-2", function(done) {
            const name = "sample-2"

            _.promise(self)
                .then(_read_in(`${name}.xml`))
                .then(xml.convert)
                .conditional(true, _write_result(`${name}.json`))
                .conditional(LOG, _log_result(`${name}.xml`))
                .then(_read_result(`${name}.json`))
                .make(sd => {
                    sd.got = sd.json
                    assert.deepEqual(sd.got, sd.want)
                })
                .end(done, {})
        })
    })
})
