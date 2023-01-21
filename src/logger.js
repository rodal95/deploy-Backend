const log4js = require("log4js")



log4js.configure({
    appenders:{
        consola:{type:"console"},
        archivoErrores:{type:"file", filename:"./src/logs/errores.log"},
        archivoWarn:{type:"file", filename:"./src/logs/warning.log"},

        loggerConsola:{type:"logLevelFilter", appender:"consola", level:"info"},
        loggerErrores:{type:"logLevelFilter", appender:"archivoErrores", level:"error"},
        loggerWarning:{type:"logLevelFilter", appender:"archivoWarn", level:"warn"}
    },
    categories:{
        default:{appenders:["loggerConsola","loggerErrores","loggerWarning"], level:"all"},
    }
})


let logger = log4js.getLogger()



module.exports = {logger}