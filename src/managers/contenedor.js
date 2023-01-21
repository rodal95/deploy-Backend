const fs = require('fs');
const path = require("path")

class Contenedor{
    constructor(nameFile){
        this.nameFile = path.join(__dirname,`../files/${nameFile}`);
    }
    save = async (product)=>{
        try {
            if(fs.existsSync(this.nameFile)){
                const contenido = await fs.promises.readFile(this.nameFile, "utf-8")
                if(contenido){
                    const productos = JSON.parse(contenido)
                    const newProduct ={
                        id:productos.length+1,
                        ...product
                    }
                    productos.push(newProduct)
                   await fs.promises.writeFile(this.nameFile, JSON.stringify(productos, null, 2))
                }else{
                    const newProduct ={
                        id:1,
                        ...product
                    }
                   await fs.promises.writeFile(this.nameFile, JSON.stringify([newProduct], null, 2))
                }
            }else{
                const newProduct ={
                    id:1,
                    ...product
                }
               await fs.promises.writeFile(this.nameFile, JSON.stringify([newProduct], null, 2))
            }
        } catch (error) {
            console.log(error)
            }
        }
    getById = async(id)=>{
        try {
            if(fs.existsSync(this.nameFile)){
                const contenido = await fs.promises.readFile(this.nameFile, "utf-8")
                if(contenido){
                    const productos = JSON.parse(contenido)
                    const producto = productos.find(item=>item.id == id)
                    return producto
                }else{
                    return "el archivo no esta"
                }
            }
        } catch (error) {
            console.log(error)
            
        }

    }
    getAll = async()=>{
        if(fs.existsSync(this.nameFile)){
          const contenido = await fs.promises.readFile(this.nameFile, "utf-8")
        const productos = JSON.parse(contenido)
        return productos  
        }
        return {status:'error',message:"no hay productos"}
        
    }
    deleteById = async (id)=>{
        const contenido = await fs.promises.readFile(this.nameFile, "utf-8")
        const productos = JSON.parse(contenido)
        const nuevoselementos = productos.filter(item => item.id != id)
        await fs.promises.writeFile(this.nameFile, JSON.stringify(nuevoselementos, null, 2))
    }
    deleteAll = async ()=>{
        const contenido = await fs.promises.readFile(this.nameFile, "utf-8")
        await fs.promises.writeFile(this.nameFile, JSON.stringify([]))
    }
}

module.exports = Contenedor