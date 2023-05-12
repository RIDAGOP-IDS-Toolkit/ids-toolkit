import {JSONSchemaType} from "ajv"
import {BaseSourceType} from "./generic";

export type BridgeCapabilityType = {
    postProcess: string
}

/**
 * This is the type that corresponds to the BRIDGE schema
 */
export type BridgeType = BaseSourceType & {
    execute: {
        openapiSchemaUri?: string,
        apiClientModuleUri?: string,
    },
    capabilities: {
        [capabilityName: string]: BridgeCapabilityOpenApiType | BridgeCapabilityModuleType
    },
    supportModuleUri?: string
    errorMessagePath?: string
}

export type BridgeCapabilityOpenApiType = BridgeCapabilityType & {
    operation: { path?: string, method?: string, operationId?: string }
    parameters?: object
}

export type BridgeCapabilityModuleType = BridgeCapabilityType & {
    functionName: string
}

export type CapabilityType = {
    /**
     * each of capabilities/capabilities.json
     * which are instances of capabilities/capabilities.schema.json
     */
    name: string,
    // todo: default empty object
    parameters?: {
        [paramName: string]: "string" | "integer" | "float"
    },
    bodyContent?: "data" | "multipart/form-data"
}

export type OpenAPISpecSimple =  BaseSourceType & {
    servers: { url: string }[]
    paths: {
        [path: string]: {
            parameters: BasicOpenApiMethodParameter[],
            get: BasicOpenApiMethod,
            post: BasicOpenApiMethod,
            put: BasicOpenApiMethod,
            delete: BasicOpenApiMethod,
            options: BasicOpenApiMethod,
        }
    }

    components: {
        securitySchemas: {
            [schemaName: string]: {
                "type": string
                "in": string,
                "name": string
            }
        }
    }
}

export type BasicOpenApiMethodParameter = { name: string, in: string }

export type BasicOpenApiMethod = {
    headers: { string: string }
    parameters: BasicOpenApiMethodParameter[],
    operationId: string
    requestBody: {
        content: {
            "multipart/form-data": {
                schema: {
                    properties: {
                        [name: string]: {
                            type: string
                        }
                    }
                }
            },
            "application/json": {
                schema: {
                    type: object
                }
            }
        }
    },
    // the following are not used in the current implementation, but are part of the openapi spec
    responses: {
        [code: string]: {
            content: {
                "application/json": {
                    schema: {
                        type: object
                    }
                }
            }
        }
    },
    security: {
        [name: string]: string[]
    },
    tags: string[],
    summary: string,
    description: string,
    externalDocs: {
        url: string
    },
    deprecated: boolean
}

// make this redudant
// type is in the other group
export type BridgeExecutionLoadResult = {
    type: "openapi" | "module"
    // todo because open OpenAPI which is actually not loaded in loadBridgeExecution
    // but by the openapi library... this should change...
    object?: object
}

const SchemaBridgeCapabilityType: JSONSchemaType<BridgeCapabilityType> = {
    type: "object",
    properties: {
        postProcess: {type: "string"}
    },
    required: ["postProcess"]
}


export type ModuleType = { [funcName: string]: Function }

/*
export type BridgeCapabilityOpenApiType = BridgeCapabilityType & {
    operation: { path: string, method: string, operationId: string }
    parameters: object
}
 */
// const SchemaBridgeCapabilityOpenApiType: JSONSchemaType<BridgeCapabilityOpenApiType> = {
//     type: "object",
//     properties: {
//         postProcess: {type: "string"},
//         operation: {
//             type: "object",
//             properties: {
//                 path: {type: "string"},
//                 method: {type: "string"},
//                 operationId: {type: "string"}
//             }
//         },
//         parameters: {type: "object"}
//     },
//     required: ["operation"]
// }
//
// const SchemaBridgeType: JSONSchemaType<BridgeType> = {
//     type: "object",
//     properties: {
//         execute: {
//             type: "object",
//             properties: {
//                 openapiSchemaUri: {type: "string"},
//                 apiClientModuleUri: {type: "string"},
//             },
//             required: ["openapiSchemaUri", "apiClientModuleUri"]
//         },
//         capabilities: {
//             type: "object",
//             additionalProperties: {
//                 type: "object",
//        // BridgeCapabilityOpenApiType | BridgeCapabilityModuleType
//             }
//         },
//         supportModuleUri: {type: "string"},
//         errorMessagePath: {type: "string"}
//     }
// }

type A = {
    a: string
}

type AB = A & {
    b: string
}

type B =  {
    b: string
}


interface  AI  {
    a: string
}

interface BI   {
    b: string
}

interface ABI extends AI, BI {

}

interface ABI2 {
    a: string
    b: string
}


const Aschema: JSONSchemaType<A> = {
    type: "object",
    properties: {
        a: {type: "string"}
    },
    required: ["a"]
}

const ABschema: JSONSchemaType<AB> = {
    type: "object",
    properties: {
        a: {type: "string"},
        b: {type: "string"}
    },
    required: ["a"]
}

const AB2schema: JSONSchemaType<ABI> = {
    type: "object",
    properties: {
        a: {type: "string", nullable: false},
        b: {type: "string", nullable: false}
    },
    required: []
}

const AB3schema: JSONSchemaType<ABI2> = {
    type: "object",
    properties: {
        a: {type: "string"},
        b: {type: "string"}
    },
    required: []
}

interface MyData {
  foo: number
  bar?: string
}

const schema: JSONSchemaType<MyData> = {
  type: "object",
  properties: {
    foo: {type: "integer"},
    bar: {type: "string", nullable: true}
  },
  required: ["foo"],
  additionalProperties: false
}


const ABMschema: JSONSchemaType<A & B> = {
    type: "object",
    properties: {
        a: {type: "string"},
        b: {type: "string"}
    },
    required: ["a"]
}

// const B0schema: JSONSchemaType<B> = {
//     type: "object",
//     properties: {
//         b: {type: "string"}
//     }
// }

const B1schema: JSONSchemaType<B> = {
    type: "object",
    properties: {
        b: {type: "string"}
    },
    required: ["b"]
}
