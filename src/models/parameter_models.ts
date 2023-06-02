import {addInputAction} from "../ui";
import {
    ParamGenerationType,
    ProcessParamType,
    ProcessServiceActivityType,
    ProcessServiceFileInputType,
    ResultStoreType,
    SelectType,
    ServiceCheckboxType,
    ServiceInputFieldsType,
    UIInputTypes
} from "../data_types/ProcessTypes";
import {BaseService} from "./base_service";
import {Activity} from "./activity_models";
import {StoreContextEnum} from "../store_wrapper";
import {getIDS} from "./ids_model";
import get from "lodash/get";

enum ActivityParameterType {
    parentResult = "parentResult",
    previousActivityResult = "previousActivityResult",
    constant = "constant",
    generate = "generate",
    store = "store",
    queryParam = "queryParam",
    checkboxInput = "checkboxInput",
    selectInput = "selectInput",
    inputField = "inputField",
    fileInput = "fileInput",
}

export abstract class ActivityParameter {

    getValue(parentActivityResult?: any, previousActivityResult?: any): any {
        return this._getValue(parentActivityResult, previousActivityResult)
    }

    abstract _getValue(parentActivityResult?: any, previousActivityResult?: any): any

    static getActivityParameter(activity: Activity,
                                paramDef: ProcessParamType,
                                uiInputs: { [inputName: string]: UIInput },
                                executionParameter: string
    ): ActivityParameter {
        if (paramDef.field) {
            return uiInputs[paramDef.field]
        } else if (paramDef.parent) {
            return new ParentResultParameter()
        } else if (paramDef.previous) {
            return new PreviousActivityResultParameter()
        } else if (paramDef.constant) {
            return new ConstantParameter(paramDef.constant)
        } else if (paramDef.store) {
            return new StoreParameter(activity.service, paramDef.store)
        } else if (paramDef.queryParam) {
            return new QueryParameter(paramDef.queryParam)
        } else if (paramDef.generate) {
            return new GenerateParameter(activity.service, executionParameter, paramDef, activity)
        } else if (paramDef.fileInput) {
            return uiInputs[paramDef.fileInput]
        } else {
            console.error(`Undefined parameter assignment for Activity parameter: '${executionParameter}' of activity: '${activity.title}'`)
            console.error("Parameter definition", paramDef)
            return new ConstantParameter(undefined)
        }
    }

    abstract getParameterType(): ActivityParameterType

    description(): string {
        return this.getParameterType()
    }
}


/**
 * Data coming from a parent activity
 */
export class ParentResultParameter extends ActivityParameter {
    _getValue(parentActivityResult?: any): Promise<object> {
        return Promise.resolve(parentActivityResult)
    }

    getParameterType(): ActivityParameterType {
        return ActivityParameterType.parentResult
    }

}

export class PreviousActivityResultParameter extends ActivityParameter {
    _getValue(parentActivityResult?: any, previousActivityResult?: any): Promise<object> {
        return Promise.resolve(previousActivityResult)
    }

    getParameterType(): ActivityParameterType {
        return ActivityParameterType.previousActivityResult
    }

}

/**
 * A constant value
 */
export class ConstantParameter extends ActivityParameter {

    private readonly value: any

    constructor(value: any) {
        super()
        this.value = value
    }

    _getValue(): Promise<any> {
        return Promise.resolve(this.value)
    }

    getParameterType(): ActivityParameterType {
        return ActivityParameterType.constant
    }

    description(): string {
        return `${this.getParameterType()}: ${this._getValue()}`
    }
}


export class StoreParameter extends ActivityParameter {

    private readonly service: BaseService<any>
    private readonly storeSettings: ResultStoreType

    constructor(service: BaseService<any>, storeSettings: ResultStoreType) {
        super()
        this.service = service
        this.storeSettings = storeSettings
    }

    _getValue(): any {
        let key: string
        let loc: string|undefined

        // if there is a dot in the key. split it by dot and get the value from the object
        const keyParts = this.storeSettings.key.split(".")
        if (keyParts.length > 1) {
            key = keyParts[0]
            // put the rest of parts together
            loc = keyParts.slice(1).join(".")
        } else {
            key = this.storeSettings.key
        }

        let resultValue
        if (this.storeSettings.context === StoreContextEnum.PROCESS) {
            resultValue = this.service.getProcess().getStoreValue(key)
        } else if (this.storeSettings.context === StoreContextEnum.ACTIVITY) {
            resultValue = getIDS().activityStore.getStoreValue(key)
        } else { // implicit default this.storeSettings.context === StoreContextEnum.SERVICE
            resultValue = this.service.getStoreValue(key)
        }

        if (loc) {
            return get(resultValue, loc)
        } else {
            return resultValue

        }
    }

    getParameterType(): ActivityParameterType {
        return ActivityParameterType.store
    }

    description(): string {
        return `${this.getParameterType()}: ${this.storeSettings.context}-${this.storeSettings.key}`
    }

}

/**
 * A value coming from one specific activity
 */
export class GenerateParameter extends ActivityParameter {

    private readonly data: ParamGenerationType
    private readonly generatorActivity: Activity

    constructor(service: BaseService<any>, paramName: string, param: ProcessParamType, activity: Activity) {
        // debugger
        // todo, if it is a sub-activity
        super()
        this.data = param.generate as ParamGenerationType
        const generatorActivityName = `PARAMETER-GENERATE-ACTIVITY-${activity.name}_${paramName}`
        // ProcessServiceActivityType
        const activityDef: ProcessServiceActivityType = Object.assign({
            title: generatorActivityName
        }, param.generate)
        // check earlier if the function exists!?!?
        this.generatorActivity = new Activity(generatorActivityName, service, activityDef)
        this.generatorActivity.mapParameters(
            service.getProcessParameters(),
            service.getProcessPageParameters(),
            service.getUIInput())
    }

    async _getValue(parentActivityResult?: any): Promise<any> {
        // const res = await this.generatorActivity.execute()
        // console.log(res)
        try {
            return await this.generatorActivity.execute(null, null, {alert: false})
        } catch (e) {
            console.error(`GenerateVariable-activity failed: ${e}`)
        }
    }

    getParameterType(): ActivityParameterType {
        return ActivityParameterType.generate
    }

    description(): string {
        const typeS = this.data.bridgeCapability ? `bridgeCapability-${this.data.bridgeCapability}` : `moduleFunction-${this.data.moduleFunction}`
        return `${this.getParameterType()}: ${typeS}`
    }
}

/**
 * A value coming from a query-parameter
 */
export class QueryParameter extends ActivityParameter {

    private readonly paramName: string

    constructor(paramName: string) {
        super()
        this.paramName = paramName
    }

    _getValue(): string|null {
        const query_params = new URLSearchParams(window.location.search)
        return query_params.get(this.paramName)
    }

    getParameterType(): ActivityParameterType {
        return ActivityParameterType.queryParam
    }

    description(): string {
        return `${this.getParameterType()}: ${this.paramName}`
    }
}


export abstract class UIInput extends ActivityParameter {

    readonly label: string
    readonly default: string | boolean
    protected htmlElem: HTMLInputElement | HTMLSelectElement
    readonly data: UIInputTypes
    protected readonly service: BaseService<any>

    protected constructor(data: UIInputTypes, service: BaseService<any>) {
        super()
        this.label = data.label
        if ("default" in data)
            this.default = data.default
        this.data = data
        this.service = service
    }

    abstract _getValue()


    description(): string {
        return `${this.getParameterType()}: ${this?.htmlElem?.id ?? "HTML-ELEM NOT SET"}`
    }

    abstract setHtmlElem(elem: HTMLElement)
}


/**
 * A value coming from a checkbox
 */
export class CheckBox extends UIInput {

    constructor(data: ServiceCheckboxType, service: BaseService<any>) {
        super(Object.assign(data, {default: data.default || false}), service)
    }

    setHtmlElem(elem: HTMLInputElement): HTMLInputElement {
        this.htmlElem = elem
        return elem
    }

    _getValue(parentActivityResult?: any): Promise<boolean> {
        return Promise.resolve((this.htmlElem as HTMLInputElement).checked)
    }

    getParameterType(): ActivityParameterType {
        return ActivityParameterType.checkboxInput
    }

}

/**
 * A value coming from an input field
 */
export class InputField extends UIInput {
    constructor(data: ServiceInputFieldsType, service: BaseService<any>) {
        super(data, service)
    }

    setHtmlElem(elem: HTMLInputElement) {
        /**
         * set the html input element and make some adjustments if needed.
         * If the parameter comes 'fromQueryParam' it will set the value and make it readonly
         */
        this.htmlElem = elem
        /*
         the behaviour we actually want, is IF the QUERY-PARAM is present its readonly. if not.... it should be editable
         todo THERE COULD BE A PARAMETER THAT TRIGGERS AN ERROR, WHEN THE QP IS NOT SET
        */
        const data_ = (this.data as ServiceInputFieldsType)
        if (data_.fromQueryParam) {
            const query_params = new URLSearchParams(window.location.search)
            if (query_params.has(data_.fromQueryParam)) {
                this.htmlElem.value = query_params.get(data_.fromQueryParam) ?? ""
                this.htmlElem.readOnly = true
                this.htmlElem.style.backgroundColor = "lightgrey"
            }
        }

        if ((this.data as ServiceInputFieldsType).inputActions) {
            addInputAction(this.service, this.htmlElem, (this.data as ServiceInputFieldsType).inputActions)
        }
    }

    _getValue(): string {
        return this.htmlElem.value
    }

    getParameterType(): ActivityParameterType {
        return ActivityParameterType.inputField
    }

}

export class SelectInput extends UIInput {

    options: { label: string, value: string }[] = []

    constructor(data: SelectType, service: BaseService<any>) {
        super(data, service)
        this.options = data.options
    }

    setHtmlElem(elem: HTMLSelectElement): HTMLSelectElement {
        this.htmlElem = elem
        return elem
    }

    _getValue(): string {
        return this.htmlElem.value
    }

    getParameterType(): ActivityParameterType {
        return ActivityParameterType.selectInput
    }

}


export class FileInput extends UIInput {
    private readData: ArrayBuffer | File | string | null
    private currentlyReading = false

    constructor(data: ProcessServiceFileInputType, service: BaseService<any>) {
        super(data, service)
    }

    async setHtmlElem(elem: HTMLInputElement): Promise<HTMLInputElement> {
        this.htmlElem = elem
        this.htmlElem.addEventListener("change", () => {
            this.readData = null
            if (this.fileinputData().readImmediately) {
                this._getValue()
            }
        })
        return Promise.resolve(this.htmlElem)
    }

    async _getValue() {
        if (this.currentlyReading)
            return
        return new Promise((resolve, reject) => {
            const files: FileList = (this.htmlElem as HTMLInputElement).files ?? new FileList()
            if(files.length > 0){
                let file = files[0]
                if (this.fileinputData().keepAsFile) {
                    this.readData = file
                    resolve(file)
                    return
                }
                let reader = new FileReader()
                if (this.fileinputData().binary) {
                    reader.readAsArrayBuffer(file)
                } else {
                    reader.readAsText(file)
                }
                this.currentlyReading = true
                reader.onload = () => {
                    this.readData = reader.result
                    this.currentlyReading = false
                    // console.log(this.readData)
                    resolve(this.readData)
                };
                reader.onerror = () => {
                    console.log(reader.error)
                    this.currentlyReading = false
                    return reject("File could not be read")
                }
            }
        })
    }

    fileinputData(): ProcessServiceFileInputType {
        return this.data as ProcessServiceFileInputType
    }

    getParameterType(): ActivityParameterType {
        return ActivityParameterType.fileInput
    }

}

