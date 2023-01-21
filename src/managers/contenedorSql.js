const knex = require("knex")

class ContenedorSql{
    constructor(options, tableName){
        this.database = knex(options)
        this.table = tableName
    }
    async getAll(){
        try {
            const data = await this.database.from(this.table).select("*")
            const results = data.map(elm=>({...elm}))
            return results
        } catch (error) {
            return `hubo un error${error}`
        }
       
    }
    async save(newData){
        try {
            const [Id] = await this.database.from(this.table).insert(newData);
            return `nuevo elemento guardado con id${Id}`;
        } catch (error) {
            return `hubo un error${error}`
        }
    }
    async getById(id){
        try {
            const data = await this.database.from(this.table).where("id",id)
            return data
        } catch (error) {
            return `hubo un error${error}`
            
        }
    }

}

module.exports = ContenedorSql