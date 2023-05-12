import {anyDataInstanceType} from "./data_types/generic";
import SwaggerClient from "swagger-client"

export function __devRun() {
    console.log("DEV RUN")
        fetch("https://localcontextshub.org/api/v1/projects/259854f7-b261-4c8c-8556-4b153deebc18/", {
        mode:"cors",
    }).then(res => {
        console.log(res)
    })


    // SwaggerClient("https://demo.dataverse.org/openapi")
    fetch("https://demo.dataverse.org/openapi", {
        mode:"cors",
    }).then(res => {
        console.log(res)
    })
}