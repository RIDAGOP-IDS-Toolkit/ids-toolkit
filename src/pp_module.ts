/***
 * This module can/should be imported by process-page or process modules
 */

export function getServiceOutputElement(serviceName: string): HTMLElement | null {
    return document.querySelector(`#${serviceName}_output`)
}