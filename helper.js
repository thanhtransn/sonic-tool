async function extractData(dataInput) {
  const dataVerify = [];
  dataInput.worksheets.forEach((sheet) => {
    {
      let firstRow = sheet.getRow(1);
      if (!firstRow.cellCount) return;
      let keys = firstRow.values;
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        let values = row.values;
        let obj = {};
        for (let i = 1; i < keys.length; i++) {
          obj[keys[i]] = values[i];
        }
        dataVerify.push(obj);
      });
    }
  });
  return dataVerify;
}

async function verify(input, reference) {
  const missProductArr = [];
  const existedModel = [];
  reference = reference.map((file) => file.split(".")[0]);
  return new Promise((resolve) => {
    const data = input
      .filter((e) => {
        if (e.product_info) {
          const list = [];
          const product_info = e.product_info
            .split(";")
            .filter((i) => i.indexOf("Tên phân loại hàng") !== -1)
            .map((data) => data.split(":")[1])
            .map((e) => e.split(","));

          const product_quantity = e.product_info
            .split(";")
            .filter((i) => i.indexOf("Số lượng") !== -1)
            .map((data) => data.split(":")[1]);

          if (!product_info.every((e) => reference.includes(e[0]))) {
            let i = 0;
            for (const item of product_info) {
              if (!reference.includes(item[0]))
                list.push(`${item[0]}_${product_quantity[i]}`);
              else if (!item[1])
                list.push(
                  `${item[0]} is missing name of model_${product_quantity[i]}`
                );
              else {
                existedModel.push({
                  product: item,
                  quantity:
                    product_quantity[
                      product_info.findIndex((e) => e.join() === item.join())
                    ],
                });
              }
              i++;
            }
            missProductArr.push(list);
            return e;
          } else {
            let isMIssNameOfModel = false;
            for (let i = 0; i < product_info.length; i++) {
              if (!product_info[i][1]) {
                list.push(
                  `${product_info[i][0]} is missing name of model_${product_quantity[i]}`
                );
                isMIssNameOfModel = true;
              } else {
                const obj = {};
                obj.product = product_info[i];
                obj.quantity = product_quantity[i];
                existedModel.push(obj);
              }
            }
            if (isMIssNameOfModel) {
              missProductArr.push(list);
              return e;
            }
          }
        }
      })
      .filter((e, i) => (e["miss_model"] = missProductArr[i].join(",")));
    resolve({
      data,
      existedModel,
    });
  });
}

async function exportExistedModel(
  exporter,
  from,
  destination,
  existedModel,
  reference
) {
  const promises = [];
  const existedFileName = new Map();
  existedModel.forEach((e) => {
    const file = reference.find((el) => el.split(".")[0] === e.product[0]);
    const destinationFileName =
      e.product[1].indexOf("+") !== -1
        ? e.product[1].replace(/\+/g, " PLUS").replace(/[/\\?%*:|"<>]/g, " ")
        : e.product[1].replace(/[/\\?%*:|"<>]/g, " ");

    const type_model = `${destinationFileName} (${e.product[0]})`;
    for (let i = 0; i < e.quantity; i++) {
      let destinationPath = `${destination}/${type_model} (${
        i > 0 ? i + 1 : 1
      }).${file.split(".")[1]}`;

      let existedFileNameSize = existedFileName.get(type_model)
        ? existedFileName.get(type_model)
        : 1;

      if (existedFileName.has(type_model)) {
        destinationPath = `${destination}/${type_model} (${
          existedFileNameSize + 1
        }).${file.split(".")[1]}`;

        existedFileNameSize++;
      }

      existedFileName.set(type_model, existedFileNameSize);
      const fn = new Promise(async (resolve, reject) => {
        exporter.copyFile(`${from}/${file}`, destinationPath, (error) => {
          if (error) {
            reject({
              mesage: `Model_${e.product.join("_")} is not exported`,
              status: false,
            });
          }
          resolve({
            message: `Model_${e.product.join("_")} is exported`,
            status: true,
          });
        });
      });
      promises.push(fn);
    }
  });
  return await Promise.allSettled(promises);
}
async function exportReport(dataExport, excelWriter, path, exportFolderSize) {
  if (!dataExport.length)
    dataExport.push({
      status: "completed",
      message: "all data is exported in export_model folder!!!",
    });
  const keys = Object.keys(dataExport[0]);
  const workSheetWriter = excelWriter.addWorksheet("report", {
    pageSetup: { fitToPage: true },
  });

  workSheetWriter.state = "visible";

  workSheetWriter.columns = [
    ...keys.map((e) => ({
      header: e,
      key: e,
      width: e === "product_info" ? 150 : 30,
      style: {
        font: { name: "Arial" },
        alignment: { vertical: "top", horizontal: "left", wrapText: true },
      },
    })),
  ];

  workSheetWriter.getColumn(keys.length).style.font = {
    color: { argb: "FFC0000" },
  };
  workSheetWriter.addRows(dataExport);
  await excelWriter.xlsx.writeFile(
    `${path}/export/export_${
      exportFolderSize.length ? exportFolderSize.length + 1 : 1
    }.xlsx`
  );
}

function handelError(mainWindow, e) {
  mainWindow.send("process:error", `${e.message}_errorCode_${e.errorCode}`);
  throw 0;
}

module.exports = {
  extractData,
  verify,
  exportExistedModel,
  exportReport,
  handelError,
};
