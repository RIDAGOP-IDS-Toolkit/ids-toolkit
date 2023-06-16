import Ajv, {JSONSchemaType, ErrorObject} from "ajv/dist/2020"
import toolkit_schema from '../schemas/ridagop-toolkit.schema.json'
import addFormats from "ajv-formats"
import isEmpty from "lodash/isEmpty"
import {ProcessServiceUIType} from "./data_types/ProcessTypes";
import {getToolkit} from "./models/tk_model";
import { AnyValidateFunction } from "ajv/dist/types";


const ajv = new Ajv({allErrors: true, strict: "log", useDefaults: true})
const draft7MetaSchema = require("ajv/dist/refs/json-schema-draft-07.json")
ajv.addMetaSchema(draft7MetaSchema)

addFormats(ajv)

let globalSchemaUri: string

/**
 * Init the json-schema validator with all required schemas.
 */
export async function initAjv(): Promise<any> {
    try {
        globalSchemaUri = toolkit_schema["$id"]
        ajv.addSchema(toolkit_schema)
        console.debug("Schema loaded:", toolkit_schema["$id"])
    } catch (e) {
        console.error("Failed to load schemas", e)
        throw e
    }
}



export function validation(schemaId_ref: string, instance: object):
    ErrorObject<string, Record<string, any>, unknown>[] {
    // console.log("trying to validate", schemaId_ref)
    const val = ajv.getSchema(`${globalSchemaUri}#/$defs/${schemaId_ref}`)
    if (val) {
        const validate: AnyValidateFunction<any> = val
        console.debug("validation:", validate.schema["title"] || validate.schema["$id"])
        // console.log(ajv.schemas, ajv)
        validate(instance);
        // console.log(name,"valid?:", valid)
        const errors = validate.errors
        // console.log("errors", errors)
        if (errors) {
            console.error(`Validation errors for ${schemaId_ref}`)
            console.error(errors)
            return errors
        } else {
            return []
        }
    }
    ajv.getSchema(globalSchemaUri)
    console.error(ajv.schemas)
    throw `Critical Ajv Error. Cannot find Sub-schema: ${schemaId_ref} in schema: ${globalSchemaUri}`
}

/**
 * Validate the ui data against the  (process)ui-schema
 * @param uiData process ui data
 * @return true if valid, false otherwise
 */
export function dynamicUIValidation(uiData: ProcessServiceUIType): boolean {
    // @ts-ignore
    // todo, do we need this?
    const uiSchema: JSONSchemaType<any> = getToolkit().schemas.processSchema.$defs.ServiceUI as JSONSchemaType<any>
    if (!uiSchema) {
        const errors = validation("P-ServicesUI", uiData)
        // TODO What todo on errors!
        if (isEmpty(errors)) {
            console.log("build UI")
            return true
        }
    }
    return false
}

