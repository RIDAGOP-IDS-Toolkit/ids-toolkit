import {BridgeType} from "./bridge_types";
import {BaseSourceType, DataSourceType} from "./generic";
import {AuthorizationConfigType, ProcessPageServiceType, ServerConfigType} from "./process_page_types";
import {StoreContextEnum} from "../store_wrapper";


/**
 * Process
 */
export type ProcessType = BaseSourceType & {
    title: string
    services: { [name: string]: ProcessServiceType }
    common?: ProcessCommonsType
    scriptUri?: string
    description?: string
}
/**
 * Process (level 2)
 */

export type ProcessServiceType = {
    title: string
    description: string
    ui: ProcessServiceUIType
    activities: { [activityName: string]: ProcessServiceActivityType }
    sequences: { [sequenceName: string]: ProcessServiceSequenceType }
    parameters: { [processParamName: string]: string }
    autostart: string | string[]
    bridge?: ServiceBridgeType
}


export type ServiceBridgeType = {
    server?: ServerConfigType
    authorization: { [authName: string]: AuthorizationConfigType }
    source: DataSourceType<BridgeType>
}

export type ProcessServiceSequenceType = {
    title: string
    activities: string[]
}

export type ServiceInputFieldsType = {
    label: string
    default: string
    fromQueryParam: string
    textArea: boolean
    inputActions: { autoAction: string }
}

export type ServiceCheckboxType = {
    label: string
    default: boolean
}


export type ProcessServiceButtonType = {
    // todo change schema to OneOf
    label: string
    triggerActivity?: string
    triggerSequence?: string
}

export type ProcessCommonButtonType = ProcessServiceButtonType & {
    activityService: string
}

export type ProcessServiceFileInputType = {
    label: string
    accept: string
    binary: boolean // readAsArrayBuffer or readAsText
    readImmediately: boolean // read onchange
    keepAsFile: boolean // keep as File object
}

export type SelectType = {
    /**
     * html select
     */
    label: string
    options: { label: string, value: string }[]
    default: string
}
/**
 * Process (level 3: services)
 */

export type ProcessServiceUIType = {
    inputFields?: {
        [fieldName: string]: ServiceInputFieldsType
    }

    selects?: {
        [fieldName: string]: SelectType
    }
    checkBoxes?: {
        [fieldName: string]: ServiceCheckboxType
    }
    buttons?: {
        [fieldName: string]: ProcessServiceButtonType
    }
    fileInputs?: {
        [fileInputdName: string]: ProcessServiceFileInputType
    }
}

/**
 * Process (level 4: activities)
 */

export type ProcessParamsType = { [paramName: string]: ProcessParamType }
// todo merge with ActivityReference
/**
 * Process (level 5: activities.parameters.generate)
 */

export type ParamGenerationType = {
    bridgeCapability?: string,
    moduleFunction?: string
    parameters: ProcessParamsType
}

export type ProcessServiceActivityType = {
    title: string,
    preProcess?: string
    bridgeCapability?: string,
    moduleFunction?: string
    parameters: ProcessParamsType
    requestBody?: ProcessParamsType
    requiredActivities?: RequiredActivityType[]
    subActivities?: { [activityName: string]: ProcessServiceActivityType }
    storeResult?: { context: StoreContextEnum, key: string }
    priority?: number

    ui?: {
        resultAsOutputHtml?: string
        resultAsDynamicUI?: boolean // todo, make this a string too
        resultsAsOpenInput?: boolean | "start" | "end"
        alert?: boolean
        includeInStatus?: boolean
    }

    debug?: {
        execute?: boolean
        resultData: object
    }
}

/**
 * Process (level 5: activities.parameters)
 */

export type ProcessParamType = {
    type: "string" | "number" | "boolean"
    constant?: string | number | boolean // a constant non changing value
    parent?: true | undefined // result from the parent activity... passed down
    previous?: true | undefined // result from the previous activity passed along
    field?: string // from input-field (textfield/textarea) defined in ProcessServiceType.inputFields
    queryParam?: string // URL query parameter
    processStore?: string // global store // todo deprecated
    serviceStore?: string // service store // todo deprecated
    store?: ResultStoreType
    generate?: ParamGenerationType
    fileInput?: string // from file input defined in ProcessServiceType.fileInputs
    dynamic?: boolean
}

export type ResultStoreType = {
    context: StoreContextEnum
    key: string
}

export type ProcessCommonsType = {
    ui: ProcessServiceUIType,
    activities: { [activityName: string]: (ProcessServiceActivityType | ActivityReferenceType) }
    sequences: { [sequenceName: string]: ProcessServiceSequenceType }
}


export type BasicActivityReferenceType = {
    activityName: string
    serviceName: string
    activityTitle?: string
}
/**
 * We use "serviceName" to differentiate this from ProcessServiceActivityType
 */
export type ActivityReferenceType = BasicActivityReferenceType & {
    title: string
    subActivities?: { [activityName: string]: ProcessServiceActivityType }
    debug?: {
        execute?: boolean
        resultData: object
    }
}

export type RequiredActivityType = BasicActivityReferenceType & {
    errorMessage: string
}

export type UIInputTypes = ServiceInputFieldsType | ServiceCheckboxType | ProcessServiceFileInputType | SelectType
export type ServiceData = {
    processServiceDescription: ProcessServiceType
    processPageServiceDescription: ProcessPageServiceType
}

// export type AnyServiceDescription = ProcessServiceType | ProcessPageServiceType