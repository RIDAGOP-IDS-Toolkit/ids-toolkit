import {ModuleType} from "../data_types/bridge_types";
import {FunctionSourceEnum, NodeType} from "../const";
import {getToolkit} from "./tk_model";
import {Bridge} from "./bridge_models";

export default class Module_wrapper {

    private readonly module: ModuleType
    readonly srcMap: { [functionName: string]: string }
    private parent: Bridge<any>
    public node_id

    constructor(module: ModuleType, srcMap: { [functionName: string]: FunctionSourceEnum }, serviceName: string) {
        this.module = module
        this.srcMap = srcMap

        const node_name_label = serviceName + "_module"
        this.node_id = getToolkit().register_node(node_name_label, node_name_label, NodeType.module)
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