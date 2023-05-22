import {BaseService} from "./base_service";
import {ProcessCommonButtonType, ProcessServiceButtonType, ProcessServiceUIType} from "../data_types/ProcessTypes";
import {CheckBox, FileInput, InputField, SelectInput, UIInput} from "./parameter_models";
import {InputTypeEnum} from "../const";


export class ServiceUIElements {
    private readonly service: BaseService<any>
    inputFields: { [p: string]: InputField } = {}
    checkBoxes: { [p: string]: CheckBox } = {}
    buttons: { [p: string]: ServiceButton } = {}
    fileinputs: { [p: string]: FileInput } = {}
    selects: { [p: string]: SelectInput } = {}

    constructor(service: BaseService<any>, uiDefinitions: ProcessServiceUIType) {
        this.service = service


        // input fields
        for (let [inputFieldName, inputField] of Object.entries(uiDefinitions.inputFields || {})) {
            this.inputFields[inputFieldName] = new InputField(inputField, service)
        }
        // checkboxes
        for (let [checkboxName, checkbox] of Object.entries(uiDefinitions.checkBoxes || {})) {
            this.checkBoxes[checkboxName] = new CheckBox(checkbox, service)
        }
        // buttons
        for (let [btnName, btnDescr] of Object.entries(uiDefinitions.buttons || {})) {
            this.buttons[btnName] = new ServiceButton(btnDescr, this.service)
        }
        // selects
        for (let [selectName, selectDescr] of Object.entries(uiDefinitions.selects || {})) {
            this.selects[selectName] = new SelectInput(selectDescr, service)
        }
        // file inputs
        for (let [fileInputName, fileInput] of Object.entries(uiDefinitions.fileInputs || {})) {
            this.fileinputs[fileInputName] = new FileInput(fileInput, service)
        }

    }

    merge(otherUiElements: ServiceUIElements) {
        console.warn("merging in", otherUiElements)
        this.inputFields = {...this.inputFields, ...otherUiElements.inputFields}
        this.checkBoxes = {...this.checkBoxes, ...otherUiElements.checkBoxes}
        this.buttons = {...this.buttons, ...otherUiElements.buttons}
        this.fileinputs = {...this.fileinputs, ...otherUiElements.fileinputs}
        this.selects = {...this.selects, ...otherUiElements.selects}
    }

    /**
     * For logging/debugging purposes
     */
    getNames() {
        return {
            inputFields: Object.keys(this.inputFields),
            checkBoxes: Object.keys(this.checkBoxes),
            buttons: Object.keys(this.buttons),
            fileinputs: Object.keys(this.fileinputs),
            selects: Object.keys(this.selects)
        }
    }

    getInputs(type?: InputTypeEnum): { [name: string]: UIInput } {
        if (type == InputTypeEnum.Field)
            return this.inputFields
        else if (type == InputTypeEnum.Checkbox)
            return this.checkBoxes
        else if (type == InputTypeEnum.inputFile)
            return this.fileinputs
        return Object.assign({},
            this.inputFields,
            this.checkBoxes,
            this.selects,
            this.fileinputs)
    }

    getInput(name: string) {
        return this.getInputs()[name]
    }
}

export class ServiceButton {

    private readonly service: BaseService<any>
    private htmlElem: HTMLButtonElement
    private readonly data: ProcessServiceButtonType

    constructor(data: ProcessServiceButtonType | ProcessCommonButtonType, service: BaseService<any>) {
        this.data = data
        this.service = service
    }

    setHtmlElem(elem: HTMLButtonElement): HTMLButtonElement {
        this.htmlElem = elem
        if (this.data.label) {
            this.htmlElem.innerText = this.data.label
        }
        // adding trigger for button
        let activityService: BaseService<any> = this.service // default to this service/process
        if (this.service.isProcess()) {
            const activityServiceName = (this.data as ProcessCommonButtonType).activityService
            if (activityServiceName) {
                activityService = this.service.getProcess().services[activityServiceName]
            }
        }

        if (this.data.triggerActivity) {
            const {triggerActivity} = this.data
            if (triggerActivity in activityService.activities) {
                this.htmlElem.addEventListener("click", async () => {
                    await activityService.executeActivity(triggerActivity)
                })
            } else {
                console.error(`No activity called ${this.data.triggerActivity} of service ${activityService.name}`)
                this.htmlElem.disabled = true
            }
        }
        if (this.data.triggerSequence) {
            const {triggerSequence} = this.data
            if (this.data.triggerSequence in this.service.sequences) {
                this.htmlElem.addEventListener("click", async () => {
                    await activityService.executeSequence(triggerSequence)
                })
            } else {
                console.error(`No sequence called ${this.data.triggerSequence} of service ${activityService.name}`)
                this.htmlElem.disabled = true
            }
        }
        return elem
    }
}

