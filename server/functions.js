const express = require('express')
const router = express.Router()
const axios = require('axios')
const NodeCache = require( "node-cache" );
const cache = new NodeCache();
const dJSON = require('dirty-json')
const crypto = require('crypto')
var sanitizer = require('sanitizer')
var cron = require('node-cron')
var Datastore = require('nedb')

var databases = new Datastore({filename: './database/databases.json', autoload: true})
var errors = new Datastore({filename: './database/errors.json', autoload: true})

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function sanitizeJson(json) {
    let string = JSON.stringify(json)
    let sanitized = sanitizer.sanitize(string)
    let clean = JSON.parse(sanitized)
    return clean
}


// INDEX
router.get('/', (req, res) => {
    databases.count({ enabled: true }, async function(err, docs_1) {
        databases.count({enabled: false}, async function(err, docs_2) {
            databases.count({}, async function(err, docs_3) {
                res.json({"online_nodes": docs_1, "offline_nodes": docs_2, "total_nodes": docs_3})
            })
        })
    })
})

// INDEX
router.post('/', (req, res) => {
    databases.count({ enabled: true }, async function(err, docs_1) {
        databases.count({enabled: false}, async function(err, docs_2) {
            databases.count({}, async function(err, docs_3) {
                res.json({"online_nodes": docs_1, "offline_nodes": docs_2, "total_nodes": docs_3})
            })
        })
    })
})


// COMPACT CRON
cron.schedule('*/59 * * * *', () => {
    databases.find({}, async function(err, docs) {
        try {
            databases.persistence.compactDatafile
            errors.persistence.compactDatafile
        } catch (error) {
            console.log(error)
        }
    })
});



// AVAILABILITY CRON
cron.schedule('*/5 * * * *', () => {
    databases.find({}, async function(err, docs) {
        try {
            for (const val of docs) {
                var url = val.url + "/test"
                let result = await axios.post(url)
                if (result.data.status === 0 && val.enabled === false ) {
                    databases.update({_id: val._id}, { $set: {enabled: true} }, {}, async function(err, docs) {
                        console.log("Set node with name: " + val.name + " as ONLINE")
                    })
                } else if (result.data.status !== 0 && val.enabled === true ) {
                    databases.update({_id: val._id}, { $set: {enabled: false} }, {}, async function(err, docs) {
                        console.log("Set node with name: " + val.name + " as OFFLINE")
                    })
                }
            }
        } catch (error) {
            console.log(error)
        }
    })
});






// DB FIND
router.post('/find/:table', (req, res) => {
    let table = req.params.table
    databases.find({ enabled: true }, async function(err, docs) {
        try {
            const JsonAggreagate = []
            let cache_result = await cache.get(table + ":" + JSON.stringify(req.body))
            if (cache_result !== undefined ) {
                for (const val of cache_result) {
                    JsonAggreagate.push(val)
                };
            } else {
                for (const val of docs) {
                    var url = val.url + "/find/" + table
                    let result = await axios.post(url, sanitizeJson(req.body))
                    try {
                        for (const val of result.data.result) {
                            JsonAggreagate.push(dJSON.parse(val))
                        };
                        cache.set( table + ":" + JSON.stringify(req.body), JsonAggreagate, 180 )
                    } catch {
                        JsonAggreagate.push()
                    }
                }
            }
            res.json({"status":0,"result":JsonAggreagate});
        } catch (error) {
            console.log(error)
            errors.insert({"error":"failed to find", "data":error}, function (err, result) {});
            res.json({"status":1, "error":"failed to find"})
        }
    })
})

// DB INSERT
router.post('/insert/:table', (req, res) => {
    let table = req.params.table
    databases.find({ enabled: true }, async function(err, docs) {
        try {
            let items = docs.length
            let node = getRandomInt(items)
            var url = docs[node].url + "/insert/" + table
            var identifiers = {
                "_time": Date.now(),
                "_id": crypto.randomUUID()
            }
            var json = {
                ...sanitizeJson(req.body),
                ...identifiers
            }
            let result = await axios.post(url, json)
            if (result.data.status === 0) {
                res.json({"status":0});
            } else if (result.data.error === "no such table: " + table) {
                await axios.post(docs[node].url + '/create-table/' + table)
                errors.insert({"error":"node did not have table, created table"}, function (err, result) {});
                let result = await axios.post(docs[node].url + '/insert/' + table, sanitizeJson(req.body))
                if (result.data.status === 0) {
                    res.json({"status":0});
                } else {
                    errors.insert({"error":"failed to insert, node could not save data", "data":result.data}, function (err, result) {});
                    res.json({"status":1, "error":"failed to insert"})
                }
            } else {
                errors.insert({"error":"failed to insert, node could not save data", "data":result.data}, function (err, result) {});
                res.json({"status":1, "error":"failed to insert"})
            }
        } catch (error) {
            errors.insert({"error":"failed to insert, node could not save data", "data":error}, function (err, result) {});
            res.json({"status":1, "error":"failed to insert"})
        }
    })
})

// DB DELETE
router.post('/delete/:table', (req, res) => {
    let table = req.params.table
    databases.find({ enabled: true }, async function(err, docs) {
        try {
            for (const val of docs) {
                var url = val.url + "/delete/" + table
                await axios.post(url, sanitizeJson(req.body))
            }
            res.json({"status":0});
        } catch (error) {
            errors.insert({"error":"failed to delete", "data":error}, function (err, result) {});
            res.json({"status":1, "error":"failed to delete"})
        }
    })
})

// DB UPDATE
router.post('/update/:table', (req, res) => {
    let table = req.params.table
    let old_json = sanitizeJson(req.body).$old
    let new_json = sanitizeJson(req.body).$new
    databases.find({ enabled: true }, async function(err, docs) {
        try {
            const JsonAggreagate = []
            for (const val of docs) {
                var url = val.url + "/find/" + table
                let result = await axios.post(url, old_json)
                for (const val of result.data.result) {     
                    let current_json = dJSON.parse(val)

                    let merged_json = {
                        ...current_json,
                        ...new_json
                    }

                    JsonAggreagate.push(merged_json)
                };

                var url = "http://0.0.0.0:9898/delete/" + table
                axios.post(url, old_json)
                
                for (const val of JsonAggreagate) {
                    var url = "http://0.0.0.0:9898/insert/" + table
                    axios.post(url, val)
                }
            }
            res.json({"status":0, "result":JsonAggreagate});
        } catch (error) {
            errors.insert({"error":"failed to update", "data":error}, function (err, result) {});
            res.json({"status":1, "error":"failed to update"})
        }
    })
})






// TABLE NEW
router.post('/create-table/:table', (req, res) => {
    let table = req.params.table
    databases.find({ enabled: true }, async function(err, docs) {
        try {
            for (const val of docs) {
                var url = val.url + "/create-table/" + table
                await axios.post(url, sanitizeJson(req.body))
            }
            res.json({"status":0});
        } catch (error) {
            errors.insert({"error":"failed to create table", "data":error}, function (err, result) {});
            res.json({"status":1, "error":"failed to create table"})
        }
    })
})

// TABLE DELETE
router.post('/delete-table/:table', (req, res) => {
    let table = req.params.table
    databases.find({ enabled: true }, async function(err, docs) {
        try {
            for (const val of docs) {
                var url = val.url + "/delete-table/" + table
                await axios.post(url, sanitizeJson(req.body))
            }
            res.json({"status":0});
        } catch (error) {
            errors.insert({"error":"failed to delete table", "data":error}, function (err, result) {});
            res.json({"status":1, "error":"failed to delete table"})
        }
    })
})

// TABLE RENAME
router.post('/rename-table/:old_name/:new_name', (req, res) => {
    let old_name = req.params.old_name
    let new_name = req.params.new_name
    databases.find({ enabled: true }, async function(err, docs) {
        try {
            for (const val of docs) {
                var url = val.url + "/rename-table/" + old_name + "/" + new_name
                await axios.post(url, sanitizeJson(req.body))
            }
            res.json({"status":0});
        } catch (error) {
            errors.insert({"error":"failed to rename table", "data":error}, function (err, result) {});
            res.json({"status":1, "error":"failed to rename table"})
        }
    })
})

// TABLE LIST
router.post('/list-tables', (req, res) => {
    databases.find({ enabled: true }, async function(err, docs) {
        try {
            const JsonAggreagate = []
            for (const val of docs) {
                var url = val.url + "/list-tables"
                let result = await axios.post(url, sanitizeJson(req.body))
                for (const val of result.data.result) {
                    if (!JsonAggreagate.includes(val)) {
                        JsonAggreagate.push(dJSON.parse(val))
                    }
                };
            }
            res.json({"status":0,"result":JsonAggreagate});
        } catch (error) {
            errors.insert({"error":"failed to list tables", "data":error}, function (err, result) {});
            res.json({"status":1, "error":"failed to list tables"})
        }
    })
})






// NODE NEW
router.post('/new-node', (req, res) => {
    databases.insert(sanitizeJson(req.body), async function(err, docs) {
        try {
            var url = sanitizeJson(req.body).url + "/test"
            let result = await axios.post(url, {"placeholder":true})
            if (result.data.status === 0) {
                res.json({"status":0});
            } else {
                res.json({"status":1,"error":"created node, but could not connect"});
            }
        } catch (error) {
            errors.insert({"error":"failed to create node", "data":error}, function (err, result) {});
            res.json({"status":1, "error":"failed to create node"})
        }
    })
})

// NODE LIST
router.post('/list-nodes', (req, res) => {
    databases.find(sanitizeJson(req.body), { _id: 0 }, async function(err, docs) {
        try {
            res.json(docs)
        } catch (error) {
            errors.insert({"error":"failed to list nodes", "data":error}, function (err, result) {});
            res.json({"status":1, "error":"failed to list nodes"})
        }
    })
})

// NODE DELETE
router.post('/delete-node', (req, res) => {
    databases.remove(sanitizeJson(req.body), async function(err, docs) {
        try {
            res.json({"status":0})
        } catch (error) {
            errors.insert({"error":"failed to delete node", "data":error}, function (err, result) {});
            res.json({"status":1, "error":"failed to delete node"})
        }
    })
})






// ERROR LIST
router.post('/list-errors', (req, res) => {
    errors.find(sanitizeJson(req.body), { _id: 0 }, async function(err, docs) {
        try {
            res.json(docs)
        } catch (error) {
            errors.insert({"error":"failed to list errors", "data":error}, function (err, result) {});
            res.json({"status":1, "error":"failed to list errors"})
        }
    })
})

// ERROR DELETE
router.post('/delete-errors', (req, res) => {
    errors.remove(sanitizeJson(req.body), async function(err, docs) {
        try {
            res.json({"status":0})
        } catch (error) {
            errors.insert({"error":"failed to delete errors", "data":error}, function (err, result) {});
            res.json({"status":1, "error":"failed to delete errors"})
        }
    })
})

module.exports = router