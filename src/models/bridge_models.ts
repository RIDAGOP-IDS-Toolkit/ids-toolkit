import {getMsg} from "../i18nLLL";
import {HasModule, LoadsFiles} from "../resolver";
import Module_wrapper from "./module_wrapper";
import {AuthorizationConfigType} from "../data_types/process_page_types";
import {ServiceBridgeType} from "../data_types/ProcessTypes";
import {
    BridgeCapabilityModuleType,
    BridgeCapabilityOpenApiType,
    BridgeExecutionLoadResult,
    BridgeType,
    ModuleType,
    OpenAPISpecSimple
} from "../data_types/bridge_types";
import {BridgeCapability, BridgeClientCapability, BridgeOpenApiCapability} from "./activity_execution_models";
import {InputField, QueryParameter} from "./parameter_models";
import {Service} from "./service_model";
import {FunctionSourceEnum, InputTypeEnum, InstanceTypeEnum, SchemaTypes} from "../const";
import SwaggerClient from "swagger-client"
// import _ from "lodash"
import mapValues from "lodash/mapValues"
import isEmpty from "lodash/isEmpty"

import {anyBridgeExecutionType, DevSourceLocationType} from "../data_types/generic";

export enum ExecutionType {
    moduleFunction = "modelFunction",
    openApiMethod = "openApiMethod",
    referenceActivity = "referenceActivity",
    clientFunction = "clientFunction"
}

export abstract class Bridge<T extends BridgeCapability> {

    readonly capabilities: { [key: string]: BridgeCapability } = {}
    readonly serviceName: string
    protected service: Service // this is added by the service
    readonly supportModule: Module_wrapper
    protected readonly bridgeData: BridgeType

    protected constructor(serviceName: string, bridgeData: BridgeType, supportModule?: ModuleType) {
        this.serviceName = serviceName
        this.bridgeData = bridgeData
        if (supportModule) {
            const sourceMap = mapValues(supportModule, () => FunctionSourceEnum.supportModule)
            this.supportModule = new Module_wrapper(supportModule, sourceMap)
        }
    }

    getCapability(capabilityName: string): BridgeCapability {
        return this.capabilities[capabilityName]
    }

    static async loadBridge(serviceName: string,
                            bridgeDescription: ServiceBridgeType,
                            source: { type: SchemaTypes, path: string },
                            validate: boolean = true): Promise<Bridge<any>> {
        console.debug("loading bridge for", serviceName, bridgeDescription)
        let bridgeInstance: BridgeType
        const errorStringInit = `Loading bridge failed for service:'${serviceName}', uri: ${bridgeDescription.source.uri}.\n`
        try {
            bridgeInstance = await LoadsFiles.loadInstance<BridgeType>({
                ...bridgeDescription.source,
                type: InstanceTypeEnum.instanceBridge,
                name: serviceName,
                location: source
            }, validate)
            console.debug(`Service ${serviceName} loaded bridgeSchema`, bridgeInstance)
        } catch (e) {
            return Promise.reject(`${errorStringInit}\n${e}`)
        }

        const promises: Promise<anyBridgeExecutionType>[] = [
            this.loadBridgeExecution(bridgeInstance, serviceName),
            Bridge.loadSupportModule(bridgeInstance, serviceName)
        ]

        try {
            const results = await Promise.all(promises)
            const bridgeExecution = results[0]
            let supportModule = undefined
            if (results.length > 1) {
                supportModule = results[1]
            }

            let bridge: Bridge<BridgeCapability>
            if (bridgeExecution.type === "openapi") {
                bridge = await new BridgeAsOpenApi(serviceName, bridgeInstance, bridgeDescription, bridgeExecution.object, supportModule)

            } else {//if (bridgeExecution.type === "module") {
                bridge = new BridgeAsModule(serviceName, bridgeInstance, bridgeExecution.object, supportModule)
            }
            return Promise.resolve(bridge)
        } catch (e) {
            return Promise.reject(`${errorStringInit}\n${e}`)
        }
    }

    static async loadBridgeExecution(bridgeData: BridgeType, serviceName: string): Promise<BridgeExecutionLoadResult | undefined> {
        /**
         * Load OpenApi or client module
         */
        const {openapiSchemaUri, apiClientModuleUri} = bridgeData.execute
        if (openapiSchemaUri) {
            const openapi_spec = await BridgeAsOpenApi.loadExecution(openapiSchemaUri, serviceName,
                LoadsFiles.getSourceLocationDefinition(InstanceTypeEnum.instanceBridge, InstanceTypeEnum.openApi, serviceName)
            )
            return Promise.resolve({type: "openapi", object: openapi_spec})
        } else if (apiClientModuleUri) {
            try {
                const module = await BridgeAsModule.loadExecution(apiClientModuleUri, serviceName,
                    LoadsFiles.getSourceLocationDefinition(InstanceTypeEnum.instanceBridge, InstanceTypeEnum.openApi, serviceName)
                )
                return Promise.resolve({type: "module", object: module})
            } catch (e) {
                await Promise.reject(e)
            }
        }
        return Promise.reject("No bridge execution defined")
    }

    static async loadSupportModule(bridgeInstance: BridgeType, serviceName: string): Promise<anyBridgeExecutionType> {
        if (bridgeInstance.supportModuleUri) {
            return LoadsFiles.importModule(
                bridgeInstance.supportModuleUri,
                InstanceTypeEnum.moduleBridgeSupport,
                LoadsFiles.getSourceLocationDefinition(InstanceTypeEnum.instanceBridge, InstanceTypeEnum.moduleBridgeSupport, serviceName),
                serviceName)
        } else {
            return Promise.resolve(undefined)
        }
    }


    setService(service: Service) {
        this.service = service
    }

    getModuleFunction(functionName: string): Function {
        return this.supportModule.getModuleFunction(functionName)
    }

    hasModuleFunction(functionName: string): boolean {
        return this.supportModule.hasModuleFunction(functionName)
    }

    listFunctions() {
        return this.supportModule.listFunctions()
    }

    errorMessagePath(): string | undefined {
        return this.bridgeData.errorMessagePath
    }
}

export class BridgeAsOpenApi extends Bridge<BridgeOpenApiCapability> {

    openapiSchema: OpenAPISpecSimple
    swaggerClient: SwaggerClient
    authorization: { [authName: string]: AuthorizationConfigType }

    constructor(serviceName: string, bridgeData: BridgeType,
                bridgeDescription: ServiceBridgeType, openAPISchema: OpenAPISpecSimple, supportModule?: ModuleType) {
        super(serviceName, bridgeData, supportModule)
        if (bridgeDescription.authorization) {
            this.authorization = bridgeDescription.authorization
        }
        this.openapiSchema = openAPISchema
        // todo this is async...
        this.createSwaggerClient()
    }


    static async loadExecution(uri: string, serviceName: string, location: DevSourceLocationType) {
        let openapi
        try {
            console.log("load bridge openapi", uri, location, "loc")
            // todo currently not validated
            openapi = await LoadsFiles.loadInstance<OpenAPISpecSimple>({
                uri,
                type: InstanceTypeEnum.openApi,
                name: serviceName,
                location
            }, false)
        } catch (e) {
            console.error("load bridge openapi error", e)
            throw e
        }
        return Promise.resolve(openapi)
    }

    async createSwaggerClient() {
        const schemaUri = this.bridgeData.execute.openapiSchemaUri as string
        this.swaggerClient = await new SwaggerClient(schemaUri, {spec: this.openapiSchema})
        if (isEmpty(this.openapiSchema)) {
            const errMsg = getMsg("OPENAPI_SPEC_NOT_VALID", {serviceName: this.serviceName})
            console.error(errMsg)
            throw errMsg
        }
        for (let [capabilityName, capabilityData] of Object.entries(this.bridgeData.capabilities)) {
            let error
            try {
                // console.log("capabilityData", capabilityData)
                this.capabilities[capabilityName] =
                    new BridgeOpenApiCapability(this, capabilityName, capabilityData as BridgeCapabilityOpenApiType, this.swaggerClient)
                continue
            } catch (err) {
                error = err
                // console.warn(error)
            }
            try {
                if (this.supportModule !== undefined) {
                    console.warn("open-api method not found, checking support module")
                    console.debug("open-api method not found, checking support module")
                    // console.log(capabilityData)
                    this.capabilities[capabilityName] =
                        new BridgeClientCapability(this, capabilityName, capabilityData as BridgeCapabilityModuleType)
                    continue
                }
            } catch (err) {
                error = err
            }
            const errMsg = getMsg("CREATING_CAPABILITY_FAILED", {
                serviceName: this.serviceName,
                capabilityName: capabilityName,
                error
            })
            console.error(errMsg)
            throw errMsg
        }
    }

    /**
     * Resets the server and returns the server-url
     */
    updateServer(): string | undefined {
        // this.openapiSchema
        const server = this.service.data.processPageServiceDescription?.bridge?.server || this.service.data.processServiceDescription?.bridge?.server
        if (server) {
            let hostName: string
            if (typeof server === "string") {
                hostName = server
            } // if its constant do the same
            else if ("constant" in server) {
                hostName = server.constant
            } else if ("queryParam" in server) {
                hostName = new QueryParameter(server.queryParam).getValue()
            } else if ("field" in server) {
                const input: InputField = this.service.getUIInput(InputTypeEnum.Field)[server.field] as InputField
                hostName = input.getValue()
            } else {
                throw "Unknown server configuration"
            }
            this.swaggerClient.spec.servers = [
                {
                    url: hostName
                }
            ]
            return hostName
        }
    }

    updateAuthorization() {
        // console.log("AUTH", this.authorization, "swagger", )

        if (this.authorization) {
            for (let [authName, configuration] of Object.entries(this.authorization)) {
                let authValue: string | null = null
                if (typeof configuration === "string") {
                    authValue = configuration
                } // if it is constant do the same
                else if ("constant" in configuration) {
                    authValue = configuration.constant
                } else if ("queryParam" in configuration) {
                    authValue = new QueryParameter(configuration.queryParam).getValue()
                } else if ("field" in configuration) {
                    const input: InputField = this.service.getUIInput(InputTypeEnum.Field)[configuration.field] as InputField
                    authValue = input.getValue()
                }
                if (authValue) {
                    console.log("auth-value", authValue)
                    console.log(this.swaggerClient,authName)
                    this.swaggerClient.authorizations = {
                        [authName]: authValue
                    }
                }
            }
        }
    }
}

export class BridgeAsModule extends Bridge<BridgeClientCapability> implements HasModule {

    private module: Module_wrapper

    constructor(serviceName: string, bridgeData: BridgeType, bridgeExecution: ModuleType, supportModule?: ModuleType) {
        super(serviceName, bridgeData, supportModule)
        const sourceMap = mapValues(bridgeExecution, () => FunctionSourceEnum.bridgeModule)
        this.module = new Module_wrapper(bridgeExecution, sourceMap)
        for (let [capabilityName, capabilityData] of Object.entries(bridgeData.capabilities)) {
            // console.log(capabilityData)
            this.capabilities[capabilityName] =
                new BridgeClientCapability(this, capabilityName, capabilityData as BridgeCapabilityModuleType)
        }
    }

    static async loadExecution(uri: string, serviceName: string, location: DevSourceLocationType) {
        const module: ModuleType = await LoadsFiles.importModule(
            uri,
            InstanceTypeEnum.moduleBridge,
            location,
            `${InstanceTypeEnum.moduleBridge}-${serviceName}`)
        return Promise.resolve(module)
    }

    getModuleFunction(functionName: string): Function {
        return this.module.getModuleFunction(functionName)
    }

    hasModuleFunction(functionName: string): boolean {
        return this.module.hasModuleFunction(functionName)
    }

    listFunctions() {
        return this.module.listFunctions()
    }
}

