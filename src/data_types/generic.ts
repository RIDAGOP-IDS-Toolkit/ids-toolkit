import {InstanceTypeEnum, SchemaTypes} from "../const";
import {ProcessPageServiceType, ProcessPageType} from "./process_page_types";
import {ActivityReferenceType, ProcessServiceType, ProcessType} from "./ProcessTypes";
import {BridgeType, OpenAPISpecSimple} from "./bridge_types";


export type BaseSourceType = {
    uri?: string
    sourcePath?: string
}

export type DataSourceType<T extends anyDataInstanceType> = BaseSourceType & {
    instance?: T
}

export type DevSourceType = BaseSourceType & {
    type: InstanceTypeEnum
    name: string
    instance?: anyInstanceType
    location?: DevSourceLocationType
}

export type DevSourceLocationType = { type: SchemaTypes, path: string }

// export type DevSourceInstanceType<T extends anyInstanceType> = DevSourceType<T> & {
//     instance: T
// }

export type DevSourceInstanceType = {
    instance: anyInstanceType
}

// const a: DevSourceType<BridgeType> = {
//     type: InstanceTypeEnum.instanceBridge,
//     name: "bridge",
//     uri: "http://localhost:3000/bridge/1",
// }

export type ModuleInstance = any

// export type DataInstanceType = {
//     uri?: string
//     sourcePath: string
// }

// todo rename the concept of instances. instances are objects, not uri|schema. those are .
export type anyDataInstanceType = ProcessPageType | ProcessType | BridgeType | OpenAPISpecSimple
export type anyBridgeExecutionType = OpenAPISpecSimple | ModuleInstance
export type anyInstanceType = ProcessPageType | ProcessType | BridgeType | OpenAPISpecSimple | ModuleInstance


// export type SourceType = {
//     type: InstanceTypeEnum
//     name: string
//     uri?: string
//     schema?: anyInstanceType
// }

export enum ToolkitEventTypeEnum {
    activityCompleted = "activityCompleted",
    activityFailed = "activityFailed"
}

export type ToolkitEventType = {
    type: ToolkitEventTypeEnum
    eventData: ActivityReferenceType
}

export type CompletePPType = ProcessPageType & {
    process: ProcessType & {
        services: {
            [name: string]: ProcessServiceType & {
                bridge: BridgeType & {
                    execute: {
                        openapiSchemaUri?: OpenAPISpecSimple,
                        apiClientModuleUri?: string,
                    }
                }
            }
        },
    }
    services: {
        [key: string]: ProcessPageServiceType & {
            bridge: BridgeType & {
                execute: {
                    openapiSchemaUri?: OpenAPISpecSimple,
                    apiClientModuleUri?: string,
                }
            }
        }
    }
}


export type Node = {
    id: string,
    label: string,
    links: NodeLink[]
    type: string,
    props: object
}

export type NodeLink = {
    id?: string,
    dest: string,
    props: object
}