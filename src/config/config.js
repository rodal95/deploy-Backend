const dotenv = require("dotenv")
const path = require("path")

dotenv.config({
    path: path.join(__dirname,".env")
})

dotenv.config()


const bases = {
    usuarios: process.env.BASEUSUARIOS,
    sesiones:process.env.BASESESIONES
}

module.exports = {bases}

