const fs = require('fs');
const project_dir = process.env.PWD
const base_path = project_dir + "/../schemas/"

const destinationPath = base_path + "ridagop-ids-toolkit.schema.json"

const files = [
    base_path + "bridge.schema.json",
    base_path + "process.schema.json",
    base_path + "process_page.schema.json",
    base_path + "capabilities_list.schema.json"]
// base_path + "openapi.schema.json",]

// the names are used in base.ts/LoadsFiles.loadInstance
// and are listed in consts.ts/SCHEMA_NAMES
const subCollectionMap = {
    "bridge.schema.json": "Bridge",
    "process.schema.json": "Process",
    "process_page.schema.json": "ProcessPage",
    "capabilities_list.schema.json": "CapabilityNames",
    // "openapi.schema.json": "OpenApi",
}


/*
replace $ref to external files with in-file references
 */
function recursiveRefSearch(data) {
    if (data["$ref"] !== undefined && typeof data["$ref"] === 'string') {
        // not internal ref
        if (!data["$ref"].startsWith("#/$defs/")) {
            // const before = data["$ref"]
            // reference to another schema file
            const subSchemaIndex = data["$ref"].indexOf("#/$defs/")
            // reference to a sub-schema of another schema file
            if (subSchemaIndex !== -1) {
                const real_ref = data["$ref"].split("/").at(-1)
                data["$ref"] = "#/$defs/" + real_ref
            } else {
                // reference to a schema file. rename reference to schema name
                const ref_filename = data["$ref"].split("/").at(-1)
                if (ref_filename in subCollectionMap) {
                    data["$ref"] = "#/$defs/" + subCollectionMap[ref_filename]
                }
            }
            // console.log("replaced $ref", before, "->", data["$ref"])
        }
    }
    // recursive search
    for (let key in data) {
        if (typeof data[key] === 'object') {
            const result = recursiveRefSearch(data[key])
            if (result !== undefined) {
                return result
            }
        }
        // also lists
        if (Array.isArray(data[key])) {
            for (let item of data[key]) {
                if (typeof item === 'object') {
                    const result = recursiveRefSearch(item)
                    if (result !== undefined) {
                        return result
                    }
                }
            }
        }
    }
    return undefined
}

// resulting $defs
const resultDefs = {}

for (let file of files) {
    // get the filename of the path in "file":
    let filename = file.split('/')
    filename = filename[filename.length - 1]
    console.log("***", filename)

    const data = fs.readFileSync(file, 'utf8')
    const jsonData = JSON.parse(data);
    // copy all objects from $defs
    Object.assign(resultDefs, jsonData.$defs)
    // console.log("FILE", file)
    recursiveRefSearch(jsonData)

    const rootCopy = Object.assign({}, jsonData)
    delete rootCopy.$defs
    delete rootCopy.$id
    delete rootCopy.$schema

    const name = subCollectionMap[filename]
    resultDefs[name] = rootCopy
}

const process_page = resultDefs["ProcessPage"]
delete resultDefs["ProcessPage"]
delete process_page["title"]


const resultSchema = Object.assign({
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "http://localhost:8000/data/schema/idstk_schema/ridagop-ids-toolkit.schema.json",
    "title": "Ridagop IDS Toolkit Schema",
}, process_page, {"$defs": resultDefs})


// write result to file
fs.writeFile(destinationPath, JSON.stringify(resultSchema, null, 2), (err) => {
    if (err) {
        console.error(err);
    }
});
