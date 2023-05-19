import cloneDeep from "lodash/cloneDeep"
import get from "lodash/get"
import intersection from "lodash/intersection"
import isArray from "lodash/isArray"
import mapValues from "lodash/mapValues"
import findIndex from "lodash/findIndex"

import {ErrorObject} from "ajv/lib/types";
import {getMsg} from "./i18nLLL";
import {
    BasicOpenApiMethod,
    BasicOpenApiMethodParameter,
    BridgeCapabilityOpenApiType,
    CapabilityType,
    ModuleType,
    OpenAPISpecSimple
} from "./data_types/bridge_types";
import {ModuleTypes} from "./const";
import DevHelper from "./dev_helper";


export async function get_data<Type>(url: string): Promise<Type> {
    // @ts-ignore
    return new Promise((resolve, reject) => {
        fetch(url, {
            headers: {
                'mode': 'cors'
            }
        }).then(response => {
            if (response.status == 200) { //  && response.headers["content-type"] =="application/json", "application/schema+json"
                response.json().then(
                    data => {
                        // console.log(data)
                        return resolve(data)
                    },
                    err => {
                        console.error("error loading json", url)
                        console.error(err)
                        return reject(`could not load json from ${url}`)
                    }
                )
            } else {
                return reject(`error fetching file, ${url}`)
            }
        })
    })
}

export function errorToString(error: ErrorObject): string {
    return `instancePath: '${error.instancePath}': ${error.message}(${JSON.stringify(error.params)})`
}

export function errorsToString(errors: ErrorObject[]) {
    return errors.map(e => errorToString(e)).join("\n")
}

export function findInOpenApiSpec(openapi_spec: OpenAPISpecSimple,
                                  capability: BridgeCapabilityOpenApiType): BasicOpenApiMethod {

    /**
     * Parameters can be specified on the operator but ALSO on the path itself.
     */
    const mergeParameters = (pathParameters: BasicOpenApiMethodParameter[] = [],
                             operationParameters: BasicOpenApiMethodParameter[] = [])
        : BasicOpenApiMethodParameter[] => {
        // debugger
        const resultParameters = cloneDeep(pathParameters)
        // console.log("adding parameters", operationParameters)
        for (let opParam of operationParameters) {
            const overwriteIndex = findIndex(pathParameters,p => p.name === opParam.name && p.in === opParam.in)
            if (overwriteIndex !== -1) {
                resultParameters[overwriteIndex] = opParam
            } else {
                resultParameters.push(opParam)
            }
        }
        // console.log("merged parameters", resultParameters)
        return resultParameters
    }

    // if the operation has a path, we can directly look it up
    if (capability.operation.path && capability.operation.method) {
        console.debug("searching operation-path: ", capability.operation.path, capability.operation.method)
        const operationPath = get(openapi_spec.paths, capability.operation.path)
        // console.log(openapi_spec.paths)
        if (!operationPath) {
            throw getMsg("OPENAPI_PATH_NOT_FOUND", {capabilityString: JSON.stringify(capability)})
        }

        const operation: BasicOpenApiMethod = get(operationPath, capability.operation.method)
        if (!operation) {
            throw getMsg("OPENAPI_METHOD_NOT_FOUND",
                {capabilityString: JSON.stringify(capability), path: capability.operation.path})
        }
        console.debug("found operation", operation)

        // console.log("merge params...")
        operation.parameters = mergeParameters(operationPath.parameters, operation.parameters)
        // console.log("merge params done...")
        return operation
    } else {
        const operationId = capability.operation.operationId
        console.debug("searching operationId: ", operationId)
        for (let [_, path_def] of Object.entries(openapi_spec.paths)) {
            for (let [key, operation] of Object.entries(path_def)) {
                if (key === "parameters")
                    continue
                operation = operation as BasicOpenApiMethod
                if (operation.operationId === operationId) {
                    console.warn("TEMP NO MERGE...")
                    // operation.parameters = mergeParameters(path_def.parameters, operation.parameters)
                    console.debug("found operation", operation)
                    return operation
                }
            }
        }
        throw getMsg("OPENAPI_OPERATIONID_NOT_FOUND", {
            capabilityString: JSON.stringify(capability),
            operationId
        })
    }
}

// export function matchBridgeExecutionParameters(capability: CapabilityType, executionParams: {
//     [paramName: string]: object
// })
//     : { [paramName: string]: string } {
//     /**
//      * Check matching names. currently not used
//      * @deprecated
//      */
//     const op_param_names = Object.keys(executionParams)
//     const capability_param_names = Object.keys(capability.parameters || {});
//     // return all names that are in both name lists
//     return intersection(op_param_names, capability_param_names)
// }

export function getFunctionArguments(func: Function) {
    return (func + '')
        .replace(/\/\/.*$/mg, '') // strip single-line comments
        .replace(/\s+/g, '') // strip white space
        .replace(/\/[*][^/*]*[*]\//g, '') // strip multi-line comments
        .split("){", 1)[0].replace(/^[^(]*[(]/, '') // extract the parameters
        .replace(/=[^,]+/g, '') // strip any ES6 defaults
        .split(',').filter(Boolean); // split & filter [""]
}

export function genActivityId(serviceName: string, activityName: string): string {
    return `${serviceName}_status_${activityName}`
}

/**
 *
 * @param obj
 */
export function toArray<T>(obj: T | T[]): T[] {
    if (isArray(obj)) {
        return obj as T[]
    } else {
        return [obj] as T[]
    }
}

export function alert_throw({errorMsg, alert_ = false, throw_ = false}: {
    errorMsg: string,
    alert_: boolean,
    throw_: boolean
}) {
    if (alert_)
        alert(errorMsg)
    if (throw_)
        throw errorMsg
}

export function loadingAnimation() {
    if (document.getElementById("ridagop-loader-wrapper")) {
        return
    }
    let loaderWrapper = document.createElement('div')
    loaderWrapper.id = "ridagop-loader-wrapper"
    let loader = document.createElement('div')
    loaderWrapper.appendChild(loader)
    loaderWrapper.style.position = "fixed"
    loaderWrapper.style.top = "0"
    loaderWrapper.style.left = "0"
    loaderWrapper.style.width = "100%"
    loaderWrapper.style.height = "100%"
    // use flex to center the loader:
    loaderWrapper.style.display = "flex"
    loaderWrapper.style.justifyContent = "center"
    loaderWrapper.style.alignItems = "center"
    loaderWrapper.style.zIndex = "9999"
    loaderWrapper.style.backgroundColor = "rgba(0,0,0,0.2)"

    loader.style.border = "16px solid #f3f3f3"
    loader.style.borderTop = "16px solid #3498db"
    loader.style.borderRadius = "50%"
    loader.style.width = "120px"
    loader.style.height = "120px"
    loader.style.animation = "spin 2s linear infinite"
    // add this the spin keyframes to the document:
    document.styleSheets[0].insertRule(`
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }`, 0)

    document.body.appendChild(loaderWrapper)
}

export function removeLoadingAnimation() {
    let loaderWrapper = document.getElementById("ridagop-loader-wrapper")
    if (loaderWrapper) {
        loaderWrapper.remove()
    }
}

// export function createFunctionSourceMap(module: ModuleType, source: string): { [functionName: string]: string } {
//     return mapValues(Object.keys(module), () => source)
// }
