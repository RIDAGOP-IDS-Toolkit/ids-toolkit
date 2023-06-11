import {Service} from "./models/service_model";
import {genActivityId} from "./util";
import ProcessPage from "./models/process_page_model";
import {CheckBox, FileInput, InputField, SelectInput, UIInput} from "./models/parameter_models";
import {
    ProcessPageServiceUiInputFieldsType,
    ProcessPageServiceUiInputType,
    ProcessPageServiceUiOutputType,
    ProcessPageServiceUiStatusType,
    ProcessPageViewType
} from "./data_types/process_page_types";
import {ServiceInputFieldsType} from "./data_types/ProcessTypes";
import {BaseService} from "./models/base_service";
import {Activity} from "./models/activity_models";
import {ServiceButton, ServiceUIElements} from "./models/ui_element_models";
import {getToolkit} from "./models/tk_model";
import isEmpty from "lodash/isEmpty";
import map from "lodash/map";
import findIndex from "lodash/findIndex";
import {UIModeEnum} from "./const";

function getUIMode(): ProcessPageViewType {
    return getToolkit().processPage.view
}

export function createProcessUI(processPage: ProcessPage) {
    const processWrapper = document.createElement("div")
    const titleElem = document.createElement("h2")
    titleElem.innerText = processPage.getTitle()
    processWrapper.appendChild(titleElem)

    Object.values(processPage.process.services).forEach(service => processWrapper.appendChild(createServiceElements(service)))
    document.body.appendChild(processWrapper)
    document.body.appendChild(createCommonContainer(processPage))
    document.head.title = processPage.getTitle()

    // const cssElem = document.createElement("link")
    // cssElem.setAttribute("rel", "stylesheet")
    // cssElem.setAttribute("href", "../src/ids_core_style.css")
    // document.head.appendChild(cssElem)
}


/**
 * This is the main function creating all parts for a service/or the common part from the process
 * @param service
 */
export function createServiceElements(service: Service) {
    const serviceWrapper = document.createElement("div")
    const uiSettings = service.getUiSettings()
    if (uiSettings.display === false) {
        return serviceWrapper
    }
    // main wrapper and title
    serviceWrapper.id = service.name + "_wrapper"
    const service_header = document.createElement("h3")
    service_header.innerText = service.title
    serviceWrapper.appendChild(service_header)

    // UIElements
    const uiElementsSection = createUiElements(service.UIElements, service.name, uiSettings?.sections?.input)
    serviceWrapper.appendChild(uiElementsSection)

    // const dynamic UISection
    createDynamicUIElements(service.name, serviceWrapper)

    // status area
    const statusSection = createStatusArea(service.name, service.activities, uiSettings?.sections?.status)
    serviceWrapper.appendChild(statusSection)
    // output
    const outputSection = createOutputElements(service.name, uiSettings?.sections?.output)
    serviceWrapper.appendChild(outputSection)
    return serviceWrapper
}

export function createCommonContainer(processPage: ProcessPage): HTMLDivElement {
    // console.log(processPage.process.data.common)
    const commonContainer = document.createElement("div")
    const process = processPage.process
    const UISettings = processPage.getCommonData().ui || {}
    // UI
    const uiElements = createUiElements(process.UIElements, "common", UISettings?.sections?.input)
    commonContainer.appendChild(uiElements)
    // STATUS
    const statusWrapper = createStatusArea("process", process.activities, UISettings?.sections?.status)
    commonContainer.appendChild(statusWrapper)
    return commonContainer
}

function createUiElements(uiElements: ServiceUIElements,
                          serviceName: string,
                          uiSettings?: ProcessPageServiceUiInputType,
                          id_postfix: string = ""): HTMLDivElement {


    // const blockElements: string[] = []
    // map a element-name to a block-name
    const blockMap: { [elemName: string]: string } = {}
    const blockElements: { [blockName: string]: (string | HTMLElement)[] } = {};
    (uiSettings?.blocks ?? []).forEach(block => {
        blockElements[block.name] = []
        // for all items in the block, add the block-name to the blockMap
        block.items.forEach(item => {
            blockMap[item] = block.name
            blockElements[block.name].push(item)
        })
    })

    /* Input-fields */
    const inputWrapper = document.createElement("div")
    inputWrapper.id = `${serviceName}_inputWrapper`

    const openDivStart = document.createElement("div")
    openDivStart.id = `${serviceName}_open_start`
    inputWrapper.appendChild(openDivStart)

    const inputfieldWrapper = document.createElement("div")
    for (let [input_name, input_data] of Object.entries(uiElements.inputFields)) {
        const process_page_settings = uiSettings?.inputFields?.[input_name]
        const inputfieldElemWrapper = createInputFieldElement(serviceName, input_name, input_data, process_page_settings, id_postfix)
        if (input_name in blockMap) {
            // replace the string with the element
            const elemIndex = blockElements[blockMap[input_name]].indexOf(input_name)
            blockElements[blockMap[input_name]][elemIndex] = inputfieldElemWrapper
        } else {
            inputfieldWrapper.appendChild(inputfieldElemWrapper)
        }
    }
    inputWrapper.appendChild(inputfieldWrapper)

    // select-options
    const selectWrapper = document.createElement("div")
    for (let [selectName, select] of Object.entries(uiElements.selects)) {
        const selectElem = createSelectElement(serviceName, selectName, select, id_postfix)
        if (selectName in blockMap) {
            // replace the string with the element
            const elemIndex = blockElements[blockMap[selectName]].indexOf(selectName)
            blockElements[blockMap[selectName]][elemIndex] = selectElem
        } else {
            selectWrapper.appendChild(selectElem)
        }
    }
    inputWrapper.appendChild(selectWrapper)

    // checkboxes
    const checkboxWrapper = document.createElement("div")
    checkboxWrapper.id = "checkboxWrapper"
    checkboxWrapper.style.margin = "10px"
    for (let [checkboxName, checkbox] of Object.entries(uiElements.checkBoxes)) {
        const checkboxElem = createCheckboxElement(serviceName, checkboxName, checkbox, id_postfix)
        if (checkboxName in blockMap) {
            // replace the string with the element
            const elemIndex = blockElements[blockMap[checkboxName]].indexOf(checkboxName)
            blockElements[blockMap[checkboxName]][elemIndex] = checkboxElem
        } else {
            checkboxWrapper.appendChild(checkboxElem)
        }
    }
    inputWrapper.appendChild(checkboxWrapper)

    // fileinputs
    const fileinputWrapper = document.createElement("div")
    for (let [fileinputName, fileInput] of Object.entries(uiElements.fileinputs)) {
        // const process_page_settings = uiSettings?.?.[fileinputName]
        const inputfileWrapper = createFileInputElement(serviceName, fileinputName, fileInput, id_postfix)
        if (fileinputName in blockMap) {
            // replace the string with the element
            const elemIndex = blockElements[blockMap[fileinputName]].indexOf(fileinputName)
            blockElements[blockMap[fileinputName]][elemIndex] = inputfileWrapper
        } else {
            fileinputWrapper.appendChild(inputfileWrapper)
        }
    }
    inputWrapper.appendChild(fileinputWrapper)

    // buttons
    if (!isEmpty(uiElements.buttons)) {
        const actionWrapper = document.createElement("div")
        const actionHeader = document.createElement("h4")
        actionHeader.innerText = "Actions"
        const buttonRow = document.createElement("div")
        Object.assign(buttonRow.style, {display: "flex", "flex-wrap": "wrap", gap: "10px"})
        buttonRow.style["margin-bottom"] = "10px"
        for (let [buttonName, serviceButton] of Object.entries(uiElements.buttons)) {
            const button = serviceButton.setHtmlElem(document.createElement("button"))
            if (buttonName in blockMap) {
                // replace the string with the element
                const elemIndex = blockElements[blockMap[buttonName]].indexOf(buttonName)
                blockElements[blockMap[buttonName]][elemIndex] = button
            } else {
                buttonRow.appendChild(button)
            }
        }
        actionWrapper.appendChild(actionHeader)
        actionWrapper.appendChild(buttonRow)
        inputWrapper.appendChild(actionWrapper)
    }

    if (uiSettings?.display === false) {
        inputWrapper.style.display = "none"
    }

    // create blocks
    if (uiSettings?.blocks) {
        const allBlocks = document.createElement("div")
        // create a div for each block
        for (let block of uiSettings.blocks) {
            const blockWrapper = document.createElement("div")
            // add header with the block title
            const blockHeader = document.createElement("h4")
            blockHeader.innerText = block.title || block.name
            blockWrapper.appendChild(blockHeader)
            // add a paragrapph for the block description
            if (block.description) {
                const blockDescription = document.createElement("p")
                blockDescription.innerText = block.description
                blockWrapper.appendChild(blockDescription)
            }
            blockElements[block.name].forEach(elem => {
                if (typeof elem === "string") {
                    console.warn(`Element ${elem} not found in block ${block.name}`)
                } else {
                    blockWrapper.appendChild(elem)
                }
            })
            allBlocks.appendChild(blockWrapper)
        }
        inputWrapper.appendChild(allBlocks)
    }

    // create a new div and give the id <service_name>_open
    const openDivEnd = document.createElement("div")
    openDivEnd.id = `${serviceName}_open_end`
    inputWrapper.appendChild(openDivEnd)
    return inputWrapper
}

function createDynamicUIElements(serviceName: string, serviceWrapper: HTMLDivElement) {
    const dynamicUI = document.createElement("div")
    dynamicUI.id = serviceName + "_dyn_ui"
    dynamicUI.style.display = "none"
    const dynamicUiHeader = document.createElement("h4")
    dynamicUiHeader.style.color = "darkgreen"
    dynamicUiHeader.innerText = "Dynamic UI"
    dynamicUI.appendChild(dynamicUiHeader)
    serviceWrapper.appendChild(dynamicUI)
}

function createStatusArea(parentName: string, activities: { [name: string]: Activity },
                          settings?: ProcessPageServiceUiStatusType) {
    const statusWrapper = document.createElement("div")
    if (!isEmpty(activities)) {
        const statusHeader = document.createElement("h4")
        statusHeader.innerText = "Status"
        statusWrapper.appendChild(statusHeader)
        const statusList = document.createElement("ul")
        const ids = getToolkit()

        const getActivityElement = (activity: Activity): HTMLElement | null => {
            // console.log(activity)
            if (!(activity.activityData()?.ui?.includeInStatus ?? true)) {
                return null
            }
            const activityStatusElem = document.createElement("li")
            // activityStatusElem.setAttribute("data-exec","false")
            activityStatusElem.style["font-weight"] = "lighter"
            activityStatusElem.innerHTML = activity.title
            // statusList.appendChild(activityStatusElem)

            // activity.parentActivity
            const activityId = genActivityId(parentName, activity.name)
            // do the same for sub-activities
            if (!isEmpty(activity.subActivities)) {
                const subActivityStatusList = document.createElement("ul")
                map(activity.subActivities, getActivityElement).forEach(elem => {
                    if (elem) {
                        subActivityStatusList.appendChild(elem)
                    }
                })
                activityStatusElem.appendChild(subActivityStatusList)
            }
            ids.uiElements[activityId] = activityStatusElem

            return activityStatusElem
        }

        map(activities, getActivityElement).forEach(elem => {
            // console.log(elem)
            if (elem)
                statusList.appendChild(elem)
        })

        statusWrapper.appendChild(statusList)
    }
    if (settings?.display === false)
        statusWrapper.style.display = "none"
    return statusWrapper
}

function createOutputElements(parentName: string, settings?: ProcessPageServiceUiOutputType) {
    const serviceOutputElement = document.createElement("div")

    const serviceOutputElementHeader = document.createElement("div")
    serviceOutputElementHeader.innerText = "Output ▼"
    serviceOutputElementHeader.style["user-select"] = "none"
    serviceOutputElementHeader.style["background-color"] = "LightGrey"
    serviceOutputElementHeader.style.padding = "10px"
    serviceOutputElement.appendChild(serviceOutputElementHeader)

    const serviceOutputElementContent = document.createElement("div")
    serviceOutputElementContent.id = parentName + "_output"
    serviceOutputElement.appendChild(serviceOutputElementContent)

    serviceOutputElementHeader.addEventListener("click", () => {
        if (serviceOutputElementContent.style.display === "none") {
            serviceOutputElementContent.style.display = "block";
            serviceOutputElementHeader.innerText = "Output ▼"
        } else {
            serviceOutputElementContent.style.display = "none";
            serviceOutputElementHeader.innerText = "Output ▲"
        }
    })
    if (settings?.display === false)
        serviceOutputElement.style.display = "none"
    return serviceOutputElement
}

/**
 *  Creates the HTML input(type:text) elements or textarea for a service
 * @param serviceName
 * @param inputName
 * @param inputField The inputfield object of the service
 * @param ppInputfieldsSettings
 * @param id_postfix
 */
function createInputFieldElement(serviceName: string,
                                 inputName: string,
                                 inputField: InputField,
                                 ppInputfieldsSettings?: ProcessPageServiceUiInputFieldsType,
                                 id_postfix: string = ""): HTMLDivElement {
    // console.log(input_data, input_data)
    const wrapper = document.createElement("div")
    wrapper.classList.add("inputFieldRow")
    wrapper.style.display = "flex"
    wrapper.style["flex-wrap"] = "wrap"
    wrapper.style.margin = "10px 15px"
    const input_label = document.createElement("label")
    input_label.style.flex = "1 0 48%"
    input_label.innerText = inputField.label + ": "

    let input_field
    if ((inputField.data as ServiceInputFieldsType).textArea) {
        input_field = document.createElement("textarea")
        input_field.setAttribute("rows", "5")
        input_field.setAttribute("cols", "32")
        input_field.style.resize = "none"
        input_field.style.flex = "1 0 48%"
    } else {
        input_field = document.createElement("input")
        input_field.type = "text"
        input_field.style.flex = "1 0 48%"
    }
    input_field.name = `${serviceName}_${inputName}`
    const input_field_id = `input_${serviceName}_${inputName}${id_postfix !== "" ? "_" + id_postfix : ""}`
    input_field.id = input_field_id
    input_label.setAttribute("for", input_field_id)

    if (ppInputfieldsSettings?.default) {
        input_field.value = ppInputfieldsSettings.default
    } else if (inputField.default) {
        input_field.value = inputField.default
    }

    wrapper.appendChild(input_label)
    wrapper.appendChild(input_field)
    inputField.setHtmlElem(input_field)
    // actually don't display the field, if specified like this in the settings
    if (ppInputfieldsSettings?.display === false) {
        wrapper.style.display = "none"
    }
    return wrapper
}

function createCheckboxElement(serviceName: string, checkboxName: string, checkbox: CheckBox, id_postfix = "") {
    const checkBoxDiv = document.createElement("div")
    const checkboxElem = document.createElement("input")
    checkboxElem.id = `checkbox_${serviceName}_${checkboxName}${id_postfix !== "" ? "_" + id_postfix : ""}`
    checkbox.setHtmlElem(checkboxElem)
    const checkboxLabel = document.createElement("label")
    checkboxLabel.innerText = checkbox.label
    checkBoxDiv.appendChild(checkboxLabel)
    if (checkbox.default === true)
        checkboxElem.checked = true
    checkboxElem.setAttribute("type", "checkbox")
    checkBoxDiv.appendChild(checkboxElem)
    return checkBoxDiv

}

function createFileInputElement(serviceName: string, fileinputName: string, fileInput: FileInput, id_postfix = ""): HTMLDivElement {
    const wrapper = document.createElement("div")
    wrapper.classList.add("inputFieldRow")
    wrapper.style.display = "flex"
    wrapper.style["flex-wrap"] = "wrap"
    wrapper.style.margin = "10px 15px"
    const input_label = document.createElement("label")
    input_label.style.flex = "1 0 48%"
    input_label.innerText = fileInput.label + ": "

    const fileInputElem = document.createElement("input")
    fileInputElem.setAttribute("type", "file")

    fileInputElem.style.flex = "1 0 48%"
    fileInputElem.name = `${serviceName}_${fileinputName}`
    const fileInputElem_id = `fileInput_${serviceName}_${fileinputName}${id_postfix !== "" ? "_" + id_postfix : ""}`
    fileInputElem.id = fileInputElem_id
    input_label.setAttribute("for", fileInputElem_id)

    wrapper.appendChild(input_label)
    wrapper.appendChild(fileInputElem)

    fileInput.setHtmlElem(fileInputElem)
    return wrapper
}

function createSelectElement(serviceName: string, selectName: string, select: SelectInput, id_postfix = ""): HTMLDivElement {
    const selectWrapper = document.createElement("div")
    Object.assign(selectWrapper.style, {display: "flex", "flex-wrap": "wrap", gap: "10px", margin: "10px 15px"})
    const select_label = document.createElement("label")
    select_label.innerText = select.label + ": "
    select_label.style.flex = "1 0 48%"
    const selectElem = document.createElement("select")
    selectElem.name = `${serviceName}_${selectName}`
    const selectElem_id = `select_${serviceName}_${selectName}${id_postfix !== "" ? "_" + id_postfix : ""}`
    selectElem.id = selectElem_id
    selectElem.style.flex = "1 0 48%"
    // options
    for (let [_, option] of Object.entries(select.options)) {
        const optionElem = document.createElement("option")
        optionElem.value = option.value
        optionElem.innerText = option.label
        selectElem.appendChild(optionElem)
    }
    select_label.setAttribute("for", selectElem_id)
    selectWrapper.appendChild(select_label)
    selectWrapper.appendChild(selectElem)
    if (select.default) {
        selectElem.selectedIndex = findIndex(select.options, (option) => option.value === select.default)
    }
    select.setHtmlElem(selectElem)
    return selectWrapper
}

export function updateUI() {
    const ids = getToolkit()
    for (let execActivity of ids.getAllExecutedActivities()) {
        // console.log(execActivity)
        // console.log(ids.uiElements)
        const activityId = genActivityId(execActivity.serviceName, execActivity.activityName)
        // todo we do this cuz, subActivities are also added to executed activities but dont are not registered in this object
        if (ids.uiElements[activityId]) {
            ids.uiElements[activityId].style["font-weight"] = "bold"
            ids.uiElements[activityId].style.color = "darkgreen"
        }

    }
}

/**
 * This function makes the given inputField trigger an activity when the user presses the enter key  or clicks the button
 * Similar happens for buttons, but here we need more code, since we add and restyle more elements
 * @param service
 * @param htmlElem
 * @param inputFieldAction
 */
export function addInputAction(service: BaseService<any>, htmlElem: HTMLElement, inputFieldAction: {
    autoAction: string
}) {
    /**
     * If an inputFieldAction (with key:autoAction) exists the inputElement will get a listener for the "Enter" key
     * and there will a button placed next to it. Both will trigger some activity
     */
    const autoAction = inputFieldAction.autoAction
    if (autoAction) {
        if (autoAction in service.activities) {
            // console.log("adding autoAction")
            htmlElem.addEventListener("keyup", async function ({key}) {
                if (key == "Enter") {
                    await service.executeActivity(autoAction)
                }
            })
            const actionButton = document.createElement("button")
            actionButton.innerText = "❱"
            actionButton.addEventListener("click", async () => {
                await service.executeActivity(autoAction)
            })

            /* restructure the row a bit in order to make it look properly*/

            htmlElem.style.flex = "inherit"
            const newWrapper = document.createElement("div")
            newWrapper.style.flex = "1 0 48%"
            newWrapper.style.display = "flex"
            const parent = htmlElem.parentNode
            if (parent) {
                // console.log(htmlElem.parentNode)
                parent.removeChild(htmlElem)
                newWrapper.appendChild(htmlElem)
                newWrapper.appendChild(actionButton)
                parent.appendChild(newWrapper)
            } else {
                // that should not happen
                console.error("could not find parent of input element")
            }

        } else {
            console.error(`${service.name} does not contain any action called ${autoAction}`)
        }
    }
}

/**
 *
 * @param service
 * @param outputHtml the result to insert into the DOM
 * @param outputTarget if the target is just a boolean it uses the default, otherwise it looks for the element with the give id
 */
export function outputHtml(service: BaseService<any>, outputHtml: string | HTMLElement, outputTarget: string | boolean) {
    let outputElemId: string
    let outputElem: HTMLElement | null
    if (getUIMode().type === UIModeEnum.build || typeof outputTarget === "boolean") {
        outputElemId = `${service.name}_output`
        outputElem = document.getElementById(outputElemId)
    } else {
        outputElem = document.getElementById(outputTarget)
    }
    // console.log(outputHtml)
    if (outputElem) {
        outputElem.innerHTML = ""
        if (outputHtml instanceof HTMLElement) {
            outputElem.appendChild(outputHtml)
        } else {
            outputElem.innerHTML = outputHtml
        }
    } else {
        console.error(`Output element not found for service: ${service.name}.Id should be: ${outputTarget}`)
    }
}

export function addToOpenInputs(service: BaseService<any>, html: HTMLElement | string, position: string = "end") {
    /**
     * todo: For what is this function used? Also add it back to the schema-docs Activity.ui.resultsAsOpenInput
     currently no explained in the docs
     */
    console.debug(`adding to open inputs of ${service.name}: ${html}`)
    const positionElem = document.getElementById(`${service.name}_open_${position}`)
    let addElement: HTMLElement

    if (typeof html === "string") {
        addElement = document.createElement('div');
        addElement.innerHTML = html
    } else {
        addElement = html
    }
    if (positionElem) {
        // check if html is a string
        // todo, what is this?
        if (position === "start") {
            positionElem.appendChild(addElement)
        } else {
            positionElem.appendChild(addElement)
        }
    }
}

export function buildDynamicUI(service: BaseService<any>, uiElements: ServiceUIElements) {

    // console.log(uiData)
    const dynamic_ui_elem = document.getElementById(`${service.name}_dyn_ui`)
    if (dynamic_ui_elem) {
        // console.log(dynamic_ui_elem)
        // const serviceUiElements = new ServiceUIElements(service, uiData)
        const uiElements_ = createUiElements(uiElements, service.name, undefined, "dyn")
        dynamic_ui_elem.appendChild(uiElements_)
        if (dynamic_ui_elem.style.display === "none") {
            dynamic_ui_elem.style.display = "block"
        }
    } else {
        console.error("could not find dynamic ui element")
    }
}

function get_form_element(service_name: string): HTMLElement {
    const service_input_fields = document.querySelector(`#${service_name}_input_fields`)
    if (service_input_fields) {
        return service_input_fields as HTMLElement
    }
    const input_fields = document.querySelector("#input_fields")
    if (input_fields) {
        return input_fields as HTMLElement
    }
    return document.body
    // console.log(service_input_fields, input_fields, document.body)
}

/**
 * MAPPING
 */

export function mapProcessUI(processPage: ProcessPage) {
    Object.values(processPage.process.services).forEach(service => mapServiceElements(service))
}

function mapServiceElements(service: Service) {

    const serviceName = service.name
    const uiElements = service.UIElements
    const id_postfix = ""

    const elements: {
        typeName: string,
        elements: { [p: string]: UIInput | ServiceButton }
    }[] = [{
        typeName: "input",
        elements: uiElements.inputFields
    }, {
        typeName: "button",
        elements: uiElements.buttons
    }, {
        typeName: "select",
        elements: uiElements.selects
    }, {
        typeName: "checkbox",
        elements: uiElements.checkBoxes
    }, {
        typeName: "fileinput",
        elements: uiElements.fileinputs
    }]

    for (let elementType of elements) {
        for (let [elementName, element] of Object.entries(elementType.elements)) {
            const elementId = `${elementType.typeName}_${serviceName}_${elementName}${id_postfix !== "" ? "_" + id_postfix : ""}`
            const htmlElement = document.querySelector("#" + elementId)
            if (htmlElement) {
                if (element instanceof ServiceButton && htmlElement instanceof HTMLButtonElement) {
                    element.setHtmlElem(htmlElement)
                } else if (element instanceof SelectInput && htmlElement instanceof HTMLSelectElement) {
                    element.setHtmlElem(htmlElement)
                } else if (
                    (element instanceof InputField || element instanceof CheckBox ||
                        element instanceof FileInput) &&
                    htmlElement instanceof HTMLInputElement) {
                    element.setHtmlElem(htmlElement)
                }
            } else {
                console.error(`Could not find element with id: ${elementId} for ${elementType.typeName}: ${elementName} of service: ${serviceName}`)
            }
        }
    }


    // for (let [inputName, inputField] of Object.entries(uiElements.inputFields)) {
    //     const fieldId = `input_${serviceName}_${inputName}${id_postfix !== "" ? "_" + id_postfix : ""}`
    //     const element = document.querySelector("#" + fieldId)
    //     if (element) {
    //         if (element instanceof HTMLInputElement) {
    //             inputField.setHtmlElem(element)
    //         }
    //     } else {
    //         console.error(`Could not find element with id: ${fieldId} for input field: ${inputName} of service: ${serviceName}`)
    //     }
    // }
    //
    // for (let [buttonName, button] of Object.entries(uiElements.buttons)) {
    //     const buttonId = `button_${serviceName}_${buttonName}${id_postfix !== "" ? "_" + id_postfix : ""}`
    //     const element = document.querySelector("#" + buttonId)
    //     if (element) {
    //         if (element instanceof HTMLButtonElement) {
    //             button.setHtmlElem(element)
    //         }
    //     } else {
    //         console.error(`Could not find element with id: ${buttonId} for button: ${buttonName} of service: ${serviceName}`)
    //     }
    // }
    //
    // for (let [selectName, select] of Object.entries(uiElements.selects)) {
    //     const selectId = `select_${serviceName}_${selectName}${id_postfix !== "" ? "_" + id_postfix : ""}`
    //     const element = document.querySelector("#" + selectId)
    //     if (element) {
    //         if (element instanceof HTMLSelectElement) {
    //             select.setHtmlElem(element)
    //         }
    //     } else {
    //         console.error(`Could not find element with id: ${selectId} for select: ${selectName} of service: ${serviceName}`)
    //     }
    // }
    //
    // for (let [checkboxName, checkbox] of Object.entries(uiElements.checkBoxes)) {
    //     const checkboxId = `checkbox_${serviceName}_${checkboxName}${id_postfix !== "" ? "_" + id_postfix : ""}`
    //     const element = document.querySelector("#" + checkboxId)
    //     if (element) {
    //         if (element instanceof HTMLInputElement) {
    //             checkbox.setHtmlElem(element)
    //         }
    //     } else {
    //         console.error(`Could not find element with id: ${checkboxId} for checkbox: ${checkboxName} of service: ${serviceName}`)
    //     }
    // }
    //
    // for (let [fileInputName, fileInput] of Object.entries(uiElements.fileinputs)) {
    //     const fileinputId = `fileinput_${serviceName}_${fileInputName}${id_postfix !== "" ? "_" + id_postfix : ""}`
    //     const element = document.querySelector("#" + fileinputId)
    //     if (element) {
    //         if (element instanceof HTMLInputElement) {
    //             fileInput.setHtmlElem(element)
    //         }
    //     } else {
    //         console.error(`Could not find element with id: ${fileinputId} for file input: ${fileInputName} of service: ${serviceName}`)
    //     }
    // }
}
