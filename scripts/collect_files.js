import get from "./lodash_get.js"

// const fs = require('fs');
import {readFileSync} from "fs"

const project_dir = process.env.PWD

const base_path = project_dir + "/../public"
const pp_instances_path = base_path + "/data/instances/process_page/"

const file = "data_request.json"

const jsonData = JSON.parse(readFileSync(pp_instances_path + file, 'utf8'))

function addInstances(instance_array) {
    return Object.fromEntries(instance_array.filter(([_, value]) => value !== undefined));
}

function openFile(relFilePath) {
    const rel_path = jsonData.local_prefix_path ?? ""
    const pPath = base_path + rel_path + relFilePath
    // console.log(base_path, "++++++", rel_path, "++++++", relFilePath)
    return readFileSync(pPath, 'utf8')
}

function readInstance(sourceData) {
    if (sourceData.uri) {
        return JSON.parse(openFile(sourceData.uri))
    } else {
        return sourceData.instance
    }
}

function handleBridge(jsonData) {
    return addInstances(
        [
            ['openapiSchemaUri', get(jsonData, "execute.openapiSchemaUri")],
            ['apiClientModuleUri', get(jsonData, "execute.apiClientModuleUri")],
            ['supportModuleUri', get(jsonData, "supportModuleUri")]
        ]
    )
}

function handleService(service) {
    if (service.bridge) {
        const bridge = readInstance(service.bridge.source)
        return handleBridge(bridge)
    }
    return {}
}

function handleServices(services) {
    const servicesResult = {}
    for (let [name, service] of Object.entries(services || {})) {
        const serviceResult = handleService(service)
        if (Object.keys(serviceResult).length > 0) {
            servicesResult[name] = serviceResult
        }
    }
    if (Object.keys(servicesResult).length > 0) {
        return servicesResult
    } else {
        return undefined
    }
}

function handleProcess(data) {
    return addInstances([
        ["scriptUri", get(data, "scriptUri")],
        ["services", handleServices(data.services)]
    ])
}

const p_data = readInstance(jsonData.process)

const ppInstances = [
    ["process_file", file],
    ["process_uri", get(jsonData, "process.uri")],
    ["ppScriptUri", get(jsonData, "scriptUri")],
    ["process", handleProcess(p_data)],
    ["services", handleServices(jsonData.services)]
]


const result = addInstances(ppInstances)

console.log(result)