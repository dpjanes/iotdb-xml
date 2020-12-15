/*
 *  lib/convert.js
 *
 *  David Janes
 *  IOTDB.org
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
const errors = require("iotdb-errors")

const xml2js = require("xml2js")

/**
 */
const convert = _.promise((self, done) => {
    const xml = require("..")

    xml2js.parseString(self.document, (error, result) => {
        if (error) {
            done(error)
        } else if (!result) {
            done(new errors.Internal("no XML result?"))
        } else {
            let transformer

            if (_.is.Undefined(self.xml$cfg?.transformer)) {
                transformer = xml.transformers.standard
            } else if (_.is.Null(self.xml$cfg?.transformer)) {
                transformer = xml.transformers.noop
            } else {
                transformer = self.xml$cfg.transformer
            }

            self.json = transformer(result, self.xml$cfg)

            done(null, self)
        }
    })
})

convert.method = "convert"
convert.description = ``
convert.requires = {
    document: [ _.is.String, _.is.Buffer, ]
}
convert.accepts = {
    xml$cfg: {
        transformer: _.is.Function,
        transform_value: _.is.Function,
        transform_key: _.is.Function,
        transform_array: _.is.Function,
        filter_value: _.is.Function,
    },
}
convert.produces = {
    json: _.is.JSON,
}
convert.params = {
    document: _.p.normal,
    xml$cfg: _.p.normal,
}
convert.p = _.p(convert)

/**
 *  API
 */
exports.convert = convert
