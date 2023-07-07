export enum InputTypeEnum {
    Field, Checkbox,
    inputFile
}

export enum ServiceTypeEnum {
    process,
    service
}


export enum FunctionSourceEnum {
    processPage = "processPage",
    process = "process",
    bridgeModule = "bridgeModule",
    supportModule = "supportModule"
}

export const PreProcessErrorCancelCommand = "cancel"


export enum InstanceTypeEnum {
    instanceProcessPage = "ProcessPage_Instance",
    moduleProcessPage = "ProcessPage_Module",
    moduleProcess = "Process_Module",
    moduleBridge = "Bridge_ClientModule",
    moduleBridgeSupport = "Bridge_SupportModule",
    instanceProcess = "Process_Instance",
    instanceBridge = "Bridge_Instance",
    openApi = "Bridge_OpenApi_Instance"
}

export type SchemaTypes =
    InstanceTypeEnum.instanceProcessPage
    | InstanceTypeEnum.instanceProcess
    | InstanceTypeEnum.instanceBridge
    | InstanceTypeEnum.openApi

export const schemaNameMap = {
    [InstanceTypeEnum.instanceProcessPage]: "ProcessPage",
    [InstanceTypeEnum.instanceProcess]: "Process",
    [InstanceTypeEnum.instanceBridge]: "Bridge",
    [InstanceTypeEnum.openApi]: "OpenApi"
}

export type ModuleTypes =
    InstanceTypeEnum.moduleProcessPage
    | InstanceTypeEnum.moduleProcess
    | InstanceTypeEnum.moduleBridge
    | InstanceTypeEnum.moduleBridgeSupport


export enum UIModeEnum {
    build = "build",
    map = "map"
}

export enum NodeType {
    service = "service",
    activity = "activity",
    bridge = "bridge",
    module = "module"

}