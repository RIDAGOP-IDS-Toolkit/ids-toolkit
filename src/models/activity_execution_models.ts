import {BasicOpenApiMethod, BridgeCapabilityModuleType, BridgeCapabilityOpenApiType} from "../data_types/bridge_types";
import {findInOpenApiSpec, getFunctionArguments} from "../util";
import {getMsg} from "../i18nLLL";
import {Activity, ActivityError} from "./activity_models";
import {Bridge, BridgeAsModule, BridgeAsOpenApi, ExecutionType} from "./bridge_models";
import SwaggerClient from "swagger-client"
import merge from "lodash/merge"
import get from "lodash/get"

export abstract class ActivityExecution {
    abstract execute(parameters: object, requestBody?: any): Promise<object>

    abstract getParameterNames(): string[]

    abstract getExecutionType(): ExecutionType

    description(): string {
        return ""
    }
}

export class ModuleFunction extends ActivityExecution {
    func: Function
    funcSource: string

    constructor(func: Function, funcSource: string) {
        super()
        this.func = func
        this.funcSource = funcSource
    }

    async execute(parameters: object, requestBody?: any): Promise<object> {
        const paramValues: any[] = []
        for (let p of this.getParameterNames()) {
            paramValues.push(parameters[p])
        }
        console.debug("Sorted Func parameters", paramValues)
        return await this.func(...paramValues)
    }

    getParameterNames(): string[] {
        return getFunctionArguments(this.func)
    }

    getExecutionType(): ExecutionType {
        return ExecutionType.moduleFunction
    }

    description(): string {
        return "Function source: " + this.funcSource
    }
}

export class ReferenceActivity extends ActivityExecution {

    readonly activity: Activity

    constructor(activity: Activity) {
        super()
        this.activity = activity
    }

    async execute(parameters: object, requestBody: any): Promise<object> {
        console.log("ReferenceActivity call ref activity...")
        try {
            return await this.activity.execute(parameters)
        } catch (e) {
            throw "Referenced activity failed: " + e
        }
    }

    getParameterNames(): string[] {
        return this.activity.getExecutionParameterNames()
    }

    getExecutionType(): ExecutionType {
        return ExecutionType.referenceActivity
    }
}

export abstract class BridgeCapability extends ActivityExecution {

    protected readonly bridge: Bridge<any>
    readonly name: string
    protected active: boolean = false
    postProcessFunction: Function

    protected constructor(bridge: Bridge<any>, name: string, postProcessFunctionName?: string) {
        super()
        this.bridge = bridge
        this.name = name
        if (postProcessFunctionName) {
            if (this.bridge.hasModuleFunction(postProcessFunctionName)) {
                this.postProcessFunction = this.bridge.getModuleFunction(postProcessFunctionName)
            } else {
                console.error(`postProcess function: ${postProcessFunctionName} not in support module for service: ${bridge.serviceName}`)
                console.debug("options are", this.bridge.supportModule)
            }
        }
    }

}

export class BridgeOpenApiCapability extends BridgeCapability {

    protected readonly bridge: BridgeAsOpenApi
    protected readonly openApiOperation: BasicOpenApiMethod

    client: SwaggerClient

    constructor(bridge: BridgeAsOpenApi, name: string, data: BridgeCapabilityOpenApiType, client: SwaggerClient) {
        super(bridge, name, data.postProcess)
        this.client = client
        try {
            this.openApiOperation = findInOpenApiSpec(bridge.openapiSchema, data)
            this.active = true
        } catch (error) {
            throw getMsg("OPENAPI_BRIDGE_CAPABILITY_MISSING", {name, error})
        }
    }


    getParameterNames(): string[] {
        return Object.values(this.openApiOperation.parameters || {}).map(op => op.name)
    }

    async execute(parameters: { [paramName: string]: any }, requestBody: any): Promise<object> {
        // if pathName and method are needed we need to extend 'BasicOpenApiMethod' and add them when its found
        const {operationId} = this.openApiOperation
        let response
        this.bridge.updateServer()
        this.bridge.updateAuthorization()
        const request: {
            // spec: object,
            operationId: string,
            headers?: { [headerName: string]: string },
            parameters: { [paramName: string]: string | number },
            requestInterceptor: Function
            body?: any
        } = {
            // spec: this.bridge.openapiSchema,
            operationId,
            requestInterceptor: async req => {
                console.log("requestInterceptor", req)
                // merge into the header of the request the headers from the openapi spec
                req.headers = merge(req.headers, this.openApiOperation.headers)
                req.mode = "cors"
                // console.log(this.openApiOperation.requestBody)
                if (this.openApiOperation.requestBody) {
                    const content = this.openApiOperation.requestBody.content
                    if (content["application/json"]) {
                        req.headers["content-type"] = "application/json"
                        if (requestBody) {
                            if (typeof requestBody === "string") {
                                req.body = requestBody
                            } else {
                                req.body = JSON.stringify(requestBody)
                            }
                        }
                    } else if (content["multipart/form-data"]) {
                        req.headers["content-type"] = "multipart/form-data"
                        const formData = new FormData()
                        for (let key in requestBody) {
                            formData.append(key, requestBody[key])
                        }
                        req.body = formData
                    } else {
                        console.error("Unsupported request body content type")
                    }
                }
                console.log("requestInterceptor final", req)
                return req;
            },
            parameters,
        }
        console.log("******")
        console.log("request", request)

        try {
            // console.log(this.client)
            console.log("swaggy... execute")
            response = await this.client.execute(request)
            console.log("response", response)
        } catch (e) {
            const errorMsgPath = this.bridge.errorMessagePath()
            let errorMsg = e
            try {
                if (errorMsgPath) {
                    errorMsg = `${get(e.response.obj, errorMsgPath) || ""} ${e}`
                }
            } catch (e) {
                // doesnt matter...
            }
            return Promise.reject(errorMsg)
        }
        // flag somewhere if the clientFunction returns a Response or not
        let error_or_data = response.body
        // const error_or_data = await processResponse(response)
        // console.log("data", error_or_data)
        if (error_or_data.constructor.name === ActivityError.name) {
            throw(error_or_data)
        }

        // console.log(this.postProcessFunction)
        if (this.postProcessFunction) {
            console.debug("running postProcessFunction: ", this.postProcessFunction)
            try {
                return await this.postProcessFunction(error_or_data)
            } catch (e) {
                console.error("postProcess failed")
                return Promise.reject(e)
            }
        } else {
            return error_or_data
        }
    }

    getExecutionType(): ExecutionType {
        return ExecutionType.openApiMethod
    }
}

export class BridgeClientCapability extends BridgeCapability {

    protected readonly bridge: BridgeAsModule
    protected readonly clientFunction: Function


    constructor(bridge: Bridge<any>, name, data: BridgeCapabilityModuleType) {
        super(bridge, name, data.postProcess)
        if (bridge.hasModuleFunction(data.functionName)) {
            this.clientFunction = bridge.getModuleFunction(data.functionName)
            this.active = true
        } else {
            console.error(`Module-capability with name: ${name}- function: ${data.functionName} not found for bridge-service:`, bridge.serviceName)
            console.error(`Options: ${bridge.listFunctions()}`)
        }
    }

    async execute(parameters: { [paramName: string]: string | number }, requestBody: any): Promise<object> {
        // console.log("BRIDGE CLIENT EXEC...", requestBody)
        let parameterNames = this.getParameterNames()
        // if (["requestBody", "body"].includes(_.last(parameterNames))) {
        //     parameterNames = _.dropRight(parameterNames)
        // }
        const parameterList = parameterNames.map(pName => parameters[pName])
        let response
        try {
            response = await this.clientFunction(...parameterList, requestBody)
        } catch (e) {
            console.log("err")
            console.log(e)
        }
        console.debug(response)
        // flag somewhere if the clientFunction returns a Response or not
        const error_or_data = await this.processResponse(response)
        console.log(error_or_data)
        try {
            // console.log("data", error_or_data)
            if (error_or_data.constructor.name === ActivityError.name) {
                throw(error_or_data)
            }
            return Promise.resolve(error_or_data)
            // return await this.postProcessF(error_or_data)
        } catch (e) {
            console.error("postProcess failed")
            return Promise.reject(e)
        }

    }

    /**
     * Process the response from the clientFunction
     * Checks if the response.status-code is in the 200 range. If not, it returns a Promise.reject
     * Also converts the response to json if the content-type is application/json
     * or into a blob if the content-type is not application/json
     * @param resp the response from the clientFunction
     * @returns {Promise<ActivityError | object>}
     */
    async processResponse(resp: Response): Promise<ActivityError | object> {
        // todo, do we actually need this? the clientFunction can take care of this
        if (!resp) {
            return Promise.reject("No response")
        }
        // when resp is not of type Response, return resp
        if (!(resp instanceof Response)) {
            return resp
        }
        if (resp.status > 299) {
            // console.log(resp.statusText)
            return Promise.reject(resp.statusText)
        } else {
            // console.log(Array.from(resp.headers.entries()))
            if ((resp.headers.get("content-type") ?? "").startsWith("application/json")) {
                const json = await resp.json()
                return json
            } else {
                return Promise.resolve(resp.blob())
            }
        }
    }


    getParameterNames(): string[] {
        return getFunctionArguments(this.clientFunction)
    }

    getExecutionType(): ExecutionType {
        return ExecutionType.clientFunction
    }
}