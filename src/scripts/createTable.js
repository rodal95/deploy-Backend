const options = require("../config/dbConfig")

const knex = require("knex")

const dbMysql = knex(options.mariaDB)
const dbSqlite = knex(options.sqliteDB)

const createTables = async ()=>{
    try {
        const tableProductsExists = await dbMysql.schema.hasTable("products")
    if(tableProductsExists){
        await dbMysql.schema.dropTable("products")
    }
    
    await dbMysql.schema.createTable("products",table=>{
        table.increments("id")
        table.string("title",40).nullable(false)
        table.integer("price").nullable(false)
        table.string("image",10000).nullable(false)
    })
    console.log("tabla productos creada")
    dbMysql.destroy()

    const tableChatExists = await dbSqlite.schema.hasTable("chat")
    if(tableChatExists){
        await dbSqlite.schema.dropTable("chat")
    }
    await dbSqlite.schema.createTable("chat",table=>{
        table.increments("id")
        table.string("username",30)
        table.string("message",1000)
    })
    console.log("chat tabla creada")
    dbSqlite.destroy()
    } catch (error) {
        console.log(error)
    }
    
}


createTables()