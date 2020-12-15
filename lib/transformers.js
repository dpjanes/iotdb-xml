/*
 *  lib/transformers.js
 *
 *  David Janes
 *  IOTDB.org
 *  2020-12-15
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

/**
 */
const noop = (o, xml$cfg) => {
    return o
}

/**
 */
const simple = (o, xml$cfg) => {
    if (_.is.Dictionary(o)) {
        if (o.$) {
            _.mapObject(o.$, (value, key) => {
                o[key] = value
            })

            delete o.$
        }

        const no = {}
        _.mapObject(o, (value, key) => {
            no[key] = simple(value)
        })

        return no
    } else if (_.is.Array(o)) {
        return o.map(simple)
    } else {
        return o
    }
}

/**
 */
const standard = (o, xml$cfg) => {
    xml$cfg = _.d.clone(xml$cfg || {})
    xml$cfg.transform_value = xml$cfg.transform_value || ((value, parts) => value.trim())
    xml$cfg.transform_key = xml$cfg.transform_key || ((key, parts) => _.id.slugify(key))
    xml$cfg.transform_array = xml$cfg.transform_array || ((vs, parts) => vs.length === 1 ? vs[0] : vs)
    xml$cfg.filter_value = xml$cfg.filter_value || ((v, parts) => _.is.Empty(v) ? false : true)

    const _flatten = (_o, parts) => {
        if (_.is.Array(_o)) {
            return xml$cfg.transform_array(
                _o.map(so => _flatten(so, parts)).filter(v => xml$cfg.filter_value(v, parts)),
                parts)
        } else if (_.is.Dictionary(_o)) {
            const nd = {}
            for (let okey in _o) {
                let ovalue = _o[okey]
                const nkey = xml$cfg.transform_key(okey, parts)
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
                if (xml$cfg.filter_value(nvalue, parts)) {
                    nd[nkey] = nvalue
                }
            }

            if ((_.size(nd) === 1) && _.is.String(nd._)) {
                return nd._
            }

            return nd;
        } else if (_.is.String(_o)) {
            return xml$cfg.transform_value(_o, parts)
        } else {
            return null
        }
    }

    return _flatten(o, [])
}

/**
 *  API
 */
exports.transformers = {
    noop: noop,
    simple: simple,
    standard: standard,
}
