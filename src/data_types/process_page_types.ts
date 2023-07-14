import {ServiceBridgeType, ProcessType} from "./ProcessTypes";
import {BaseSourceType, DataSourceType} from "./generic";
import {UIModeEnum} from "../const";

/**
 * ProcessPage
 */
export type ProcessPageType = BaseSourceType & {
    title: string
    description: string
    process: DataSourceType<ProcessType>
    services: { [key: string]: ProcessPageServiceType }
    scriptUri: string
    common: ProcessPageCommonType
    schemaUri: string
    view: ProcessPageViewType
    local_prefix_path: string
}


export type ProcessPageCommonType = {
    description?: string
    ui?: ProcessPageServiceUiType
    parameters?: { [processParamName: string]: string }
    autoStart?: string | string[]
}


export type ProcessPageViewType = {
    type: UIModeEnum
}


export type ProcessPageServiceType = {
    /**
     * instance of process_page/process_page.schema.json#/properties/services
     */
    title?: string,
    description?: string,
    bridge: ServiceBridgeType
    parameters: { [processParamName: string]: string }
    autostart?: string | string[]
    ui: ProcessPageServiceUiType
}


export type ServerConfigType = string | { field: string } | { queryParam: string } | { constant: string }
export type AuthorizationConfigType = ServerConfigType

export type ProcessPageServiceUiType = {
    display?: boolean
    sections?: {
        input?: ProcessPageServiceUiInputType
        output?: ProcessPageServiceUiOutputType
        status?: ProcessPageServiceUiStatusType
    }
}


export type ProcessPageServiceUiInputType = {
    display: boolean
    inputFields: { [inputFieldName: string]: ProcessPageServiceUiInputFieldsType }
    blocks?: { name: string, title?: string, description?: string, items: string[] }[]
}

export type ProcessPageServiceUiInputFieldsType = {
    default: string
    display: boolean
}

export type ProcessPageServiceUiStatusType = {
    display: boolean
}

export type ProcessPageServiceUiOutputType = {
    display: boolean
}


