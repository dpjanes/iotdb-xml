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
    const params = _.d.clone(self.xml$cfg || {})
    params.transform_value = params.transform_value || ((value, parts) => value.trim())
    params.transform_key = params.transform_key || ((key, parts) => _.id.slugify(key))
    params.transform_array = params.transform_array || ((vs, parts) => vs.length === 1 ? vs[0] : vs)
    params.filter_value = params.filter_value || ((v, parts) => _.is.Empty(v) ? false : true)

    const _flatten = (_o, parts) => {
        if (_.is.Array(_o)) {
            return params.transform_array(
                _o.map(so => _flatten(so, parts)).filter(v => params.filter_value(v, parts)),
                parts)
        } else if (_.is.Dictionary(_o)) {
            const nd = {}
            for (let okey in _o) {
                let ovalue = _o[okey]
                const nkey = params.transform_key(okey, parts)
                if (_.is.Empty(nkey) || okey === "$") { // we need to build this into the default rule
                    continue
                }
                
                if (_.is.Array(ovalue)) {
                    const _s = ovalue.map(v => v._).filter(v => v)
                    const $s = ovalue.map(v => v.$).filter(v => v)

                    if (_s.length) {
                        ovalue = _s
                    }

                    if ($s.length) {
                        $s.forEach($ => {
                            _.mapObject($, (v, k) => {
                                nd[`${nkey}$${k}`] = v
                            })
                        })
                    }
                }

                const nvalue = _flatten(ovalue)
                if (params.filter_value(nvalue, parts)) {
                    nd[nkey] = nvalue
                }
            }
            return nd;
        } else if (_.is.String(_o)) {
            return params.transform_value(_o, parts)
        } else {
            return null
        }
    }

    xml2js.parseString(self.document, (error, result) => {
        if (error) {
            done(error)
        } else if (!result) {
            done(new errors.Internal("no XML result?"))
        } else {
            self.json = _flatten(result, [])
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
