const jsoncsv = require('json-csv')
const fs = require("fs")
const https = require('https');
const csv = require('csvtojson')
const headers = {
    'X-Auth-Token': '1k5umneoa52j9a7tntqrcgyqmlmmstgstlvgg6da7',
    'X-Auth-Tenant': 'Edulynks'
};
const ENDPOINT_API_URL = `/masterkey/agency/sale/:id/saleOrder`
const PATH_INPUT_CSV = 'input 2.csv' //Nombre del archivo input donde se espera que esten los ids
const PATH_OUTPUT_CSV = 'output.csv' //Nombre del archivo output donde se guardara el resultado
const EXPORT_CSV_OPTIONS = {
    "fields": [{
            "name": "sale.id",
            "label": "Sale id"
        },
        {
            "name": "status",
            "label": "Sale status"
        },
        {
            "name": "institute.name",
            "label": "institute name"
        },
        {
            "name": "institute.city.name",
            "label": "city"
        },
        {
            "name": "institute.city.countryCode",
            "label": "countryCode"
        },
        {
            "name": "course.name",
            "label": "course name"
        },
        {
            "name": "courseLine.startDate",
            "label": "course line startDate"
        },
        {
            "name": "courseLine.endDate",
            "label": "course line endDate"
        },
    ]
}
var waitingBatch = false;
var finalSaleOrderItems = [];

let main = async () => {
    const idsOfSaleFromCSV = await GetIdsFromCSV() //obtener los ids desde el input
    // const ids = testIds() //obtener los ids desde el input
    console.log("idsOfSaleFromCSV length", idsOfSaleFromCSV.length)
    const STEP = 20
    let first = 0
    let last = STEP
    do {
        FinishBatchCallback(await CheckThisBatch(idsOfSaleFromCSV.slice(first, last), first, last));
        first += STEP;
        last += STEP;

    } while (finalSaleOrderItems.length != idsOfSaleFromCSV.length)
    putResultInCSV() //Genera el CSV a partir de los items
    console.log("Terminado"); //visualmente mostramos que termino el proceso

}
let CheckThisBatch = (idsOfSaleFromCSV, first, last) => {
    return new Promise(resolve => {
        ReturnedPetitionCounter = idsOfSaleFromCSV.length;

        let batchItems = []
        console.log(`Buscando items del array ${first} hasta ${last}`);
        idsOfSaleFromCSV.forEach((saleId) => {
            let url = ENDPOINT_API_URL;
            url = url.replace(":id", saleId["field1"].toString());
            // console.log(2,url);


            let getOptions = {
                hostname: 'server.bookandlearn.com',
                port: 443,
                path: url,
                method: 'GET',
                headers
            };
            //   console.log(3,getOptions);

            https.get(getOptions, (resp) => {
                let data = '';

                const {
                    statusCode,
                    headers
                } = resp;
                // console.log("Respuesta",statusCode,headers,resp);
                // A chunk of data has been recieved.
                resp.on('data', (chunk) => {
                    if (chunk != undefined) {
                        data += chunk;
                    }
                });

                // The whole response has been received. Print out the result.
                resp.on('end', () => {
                    // console.log(data)
                    data = JSON.parse(data);
                    ReturnedPetitionCounter--;
                    // console.log(url, data, ReturnedPetitionCounter);
                    if (data.sale == undefined) {
                        data.sale = {};
                        data.sale.id = saleId["field1"];
                    }
                    batchItems.push(data)

                    if (HasFinishScanning(ReturnedPetitionCounter)) {
                        resolve(batchItems);
                        // console.log(`\rEncontrado items del array ${first} hasta ${last}`); //visualmente mostramos que termino el proceso
                    }
                });

            }).on("error", (err) => {
                console.log("Error: " + err.message);
            });
        })
    })
}
let FinishBatchCallback = (batchItems) => {
    MergeObtainedItems(batchItems);

}
let MergeObtainedItems = (batchItems) => {
    finalSaleOrderItems = finalSaleOrderItems.concat(batchItems);
}
let AskForAnotherBatch = () => {
    waitingBatch = false;
}
let HasFinishScanning = (ReturnedPetitionCounter) => {
    return ReturnedPetitionCounter == 0;
}

let putResultInCSV = async () => {

    jsoncsv.buffered(finalSaleOrderItems, EXPORT_CSV_OPTIONS, (err, csv) => {
        let out = fs.createWriteStream(PATH_OUTPUT_CSV, {
            encoding: 'utf8'
        })
        out.write(csv);
    })

}
let GetIdsFromCSV = async () => {
    return await csv({
        noheader: true,
        fields: ["id"]
    }).fromFile(PATH_INPUT_CSV);
}
let testIds = () => {
    const start = 71045;
    ids = []
    for (let i = 0; i < 3; i++) {
        ids.push({
            "field1": (i + start)
        });
    }
    return ids;
}
main()