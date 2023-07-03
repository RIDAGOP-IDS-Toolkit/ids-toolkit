export async function post(d, body) {
    // return a fetch promise
    return fetch(`https://licci.eu/ridagop-test-pgp-doc-store/index.php/file?d=${d}`, {
        method: 'POST',
        body: JSON.stringify(body)
    })
}