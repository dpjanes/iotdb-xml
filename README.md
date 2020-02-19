# iotdb-xml
XML POP functions

## Basic Usage

All the action is in `xml.convert`, which converts `self.document`
into `self.json`

    const _ = require("iotdb-helpers")
    const fs = require("iotdb-fs")
    const xml = require("iotdb-xml")

    _.promise()
        .then(fs.read.utf8.p("document.xml"))
        .then(xml.convert)
        .make(sd => {
            console.log(JSON.stringify(sd.json, null, 2))
        })
