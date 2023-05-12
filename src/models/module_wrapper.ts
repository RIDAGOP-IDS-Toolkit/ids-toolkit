import {ModuleType} from "../data_types/bridge_types";
import {FunctionSourceEnum} from "../const";

export default class Module_wrapper {

    private readonly module: ModuleType
    readonly srcMap: { [functionName: string]: string }

    constructor(module: ModuleType, srcMap: { [functionName: string]: FunctionSourceEnum }) {
        this.module = module
        this.srcMap = srcMap
    }

    hasModuleFunction(functionName: string): boolean {
        // call this from BridgeModule
        return functionName in this.module
    }

    getModuleFunction(functionName: string): Function {
        // call this from BridgeModule
        return this.module[functionName]
    }

    listFunctions(): string[] {
        return Object.keys(this.module)
    }
}