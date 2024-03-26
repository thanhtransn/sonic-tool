const path = require("path");
const os = require("os");
const f = require("fs");
const fs = require("fs/promises");
const Excel = require("exceljs");
const {
  handelError,
  extractData,
  verify,
  exportReport,
  exportExistedModel,
} = require("../utils/helper.js");

async function tool({ pathFileData, pathFolderData }, mainWindow, shell) {
  const __dirname = path.join(os.homedir(), "Documents", "DataExporter");
  if (!f.existsSync(__dirname)) {
    f.mkdirSync(__dirname);
  }
  const workbook = new Excel.Workbook();
  const filePath = pathFileData.trim();

  const referenceFilePath = pathFolderData.trim();

  const dataVerify = await workbook.xlsx
    .readFile(path.join(filePath).replace(/[\\/]+/g, "/"))
    .catch(() => {
      handelError(mainWindow, {
        message: "SOMETHING WENT WRONG!!!",
        errorCode: 1001,
      });
    });

  let dataReference = await fs
    .readdir(path.join(referenceFilePath).replace(/[\\/]+/g, "/"))
    .catch(() => {
      handelError(mainWindow, {
        message: "SOMETHING WENT WRONG!!!",
        errorCode: 1002,
      });
    });

  if (!f.existsSync(path.join(__dirname, "export").replace(/[\\/]+/g, "/"))) {
    try {
      f.mkdirSync(path.join(__dirname, "export"));
    } catch {
      () =>
        handelError(mainWindow, {
          message: "SOMETHING WENT WRONG!!!",
          errorCode: 1003,
        });
    }
  }

  let destinationExportModel = path
    .join(__dirname, "export_model_1")
    .replace(/[\\/]+/g, "/");
  if (!f.existsSync(destinationExportModel)) {
    try {
      f.mkdirSync(destinationExportModel);
    } catch {
      () =>
        handelError(mainWindow, {
          message: "SOMETHING WENT WRONG!!!",
          errorCode: 1004,
        });
    }
  } else {
    try {
      const size = await fs.readdir(
        path.join(__dirname).replace(/[\\/]+/g, "/")
      );

      destinationExportModel = path
        .join(
          __dirname,
          `export_model_${
            size.filter((e) => e.indexOf("export_model") !== -1).length + 1
          }`
        )
        .replace(/[\\/]+/g, "/");

      f.mkdirSync(destinationExportModel);
    } catch {
      () =>
        handelError(mainWindow, {
          message: "SOMETHING WENT WRONG!!!",
          errorCode: 1005,
        });
    }
  }

  const exportFolderSize = await fs
    .readdir(path.join(__dirname, "export").replace(/[\\/]+/g, "/"))
    .catch(() => {
      handelError(mainWindow, {
        message: "SOMETHING WENT WRONG!!!",
        errorCode: 1006,
      });
    });

  mainWindow.webContents.send(
    "process:done",
    "PROCESS IS RUNNING................"
  );

  const dataExtracted = await extractData(dataVerify).catch(() =>
    handelError(mainWindow, {
      message: "SOMETHING WENT WRONG!!!",
      errorCode: 1007,
    })
  );

  const { data, existedModel } = await verify(
    dataExtracted,
    dataReference
  ).catch(() =>
    handelError(mainWindow, {
      message: "SOMETHING WENT WRONG!!!",
      errorCode: 1008,
    })
  );

  await exportExistedModel(
    f,
    referenceFilePath,
    destinationExportModel,
    existedModel,
    dataReference,
    sender = mainWindow.webContents
  ).then().catch(() =>
      handelError(mainWindow.webContents, {
        message: "SOMETHING WENT WRONG!!!",
        errorCode: 1009,
      })
    );

  await exportReport(
    data,
    new Excel.Workbook(),
    path.join(__dirname).replace(/[\\/]+/g, "/"),
    exportFolderSize
  ).catch(() =>
    handelError(mainWindow, {
      message: "SOMETHING WENT WRONG!!!",
      errorCode: 1010,
    })
  );

  mainWindow.webContents.send("process:done", "PROCESS IS COMPLETED!!!");
  setTimeout(function () {
    if (process.env.IS_OPENED === "false") {
      shell.openPath(__dirname);
    }
    process.env.IS_OPENED = true;
    return 0;
  }, 3000);
  return 0;
}

module.exports = { tool };
