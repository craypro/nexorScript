const jsoncsv = require('json-csv')
const fs = require("fs")
const https = require('https');
const csv = require('csvtojson')
const headers = {
    'X-Auth-Token': 'Go6282lo3c9fgguub6ra77f9hagdotn4',
    'X-Auth-Tenant': 'Edulynks'
};
const pathInputCSV = 'input.csv' //Nombre del archivo input donde se espera que esten los ids
const pathOutputCSV = 'output.csv' //Nombre del archivo output donde se guardara el resultado
const opcionesParaExportarCSV = {
    "fields": [{
        "name": "name",
        "label": "Name"
    }]
}


let main = async () => {
    const ids = await getIdsFromCSV() //obtener los ids desde el input
    let items = [];
    count = ids.length;
    ids.forEach((saleId) => {
        const urlDelApi = `/masterkey/agency/sale/:id/saleOrder`
        let url = urlDelApi;
        url = url.replace(":id", saleId["field1"].toString());

      
        let getOptions ={
            hostname: 'server.bookandlearn.com',
            port: 443,
            path: url,
            method: 'GET',
            headers
          };
        https.get(getOptions, (resp) => {
            let data = '';
            const {statusCode,headers} = resp;
            console.log("Respuesta",statusCode,headers,resp);
            // A chunk of data has been recieved.
            resp.on('data', (chunk) => {
                if (chunk != undefined) {
                    data += chunk;
                }
            });

            // The whole response has been received. Print out the result.
            resp.on('end', () => {

                data = JSON.parse(data);
                count--;
                console.log(url, data, count);
                if (!data.hasOwnProperty("error")) {
                    items.push(data);
                }
                if (count == 0) { //Si ya terminaron todos, lo añade al CSV
                    items.push({
                        "name": `Ids escaneados ${items.length}`
                    }); //Al final del archivo output dice cuantos ids escaneo
                    putResultInCSV(items) //Genera el CSV a partir de los items
                    console.log("Terminado"); //visualmente mostramos que termino el proceso
                }
            });

        }).on("error", (err) => {
            console.log("Error: " + err.message);
        });
    })
}


let putResultInCSV = async (items) => {

    jsoncsv.buffered(items, opcionesParaExportarCSV, (err, csv) => {
        let out = fs.createWriteStream(pathOutputCSV, {
            encoding: 'utf8'
        })
        out.write(csv);
    })

}
let getIdsFromCSV = async () => {
    return await csv({
        noheader: true,
        fields: ["id"]
    }).fromFile(pathInputCSV);
}

main()