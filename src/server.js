const express = require("express");
const handlebars = require("express-handlebars")
const options = require("./config/dbConfig")
const bcrypt = require("bcrypt")
const {Server} = require("socket.io");
const Contenedor = require("./managers/contenedor")
const ContenedorMensajes = require("./managers/contenedorMensajes")
const {normalize,schema} = require("normalizr")
const cookieParser = require("cookie-parser");
const session = require("express-session");
const mongoose = require("mongoose")
const MongoStore = require("connect-mongo");
const passport = require("passport")
const {Strategy}  = require("passport-local")
const {userModel} = require("./models/user")
const {fork} = require("child_process")
const {bases} = require("./config/config")
const ParsedArgs = require("minimist")
const path = require("path")
const cluster = require("cluster")
const os = require("os");
const compression = require("compression");
const {logger} = require("./logger")


const opciones = {alias:{m:"mode",p:"port"},default:{mode:"FORK",port:8080}}
const objArguments = ParsedArgs(process.argv.slice(2), opciones)


//servicios
const productsServices = new Contenedor("productos.txt")
/* const productsServices = new ContenedorSql(options.mariaDB,"products") */
const mensajesApi = new ContenedorMensajes("mensajes.txt")
/* const mensajesApi = new ContenedorSql(options.sqliteDB,"chat") */
const app = express();
app.engine(".hbs",handlebars.engine({extname: '.hbs'}));
//ruta de las vistas
app.set("views", __dirname+"/views");
//vinculacion del motor a express
app.set("view engine", ".hbs");

app.use(express.json());
app.use(express.urlencoded({ extended: true }))
//trabajar con archivos estaticos de public
app.use(express.static(__dirname+"/public"));
app.use(cookieParser());
const MODO = objArguments.mode || "FORK"
const PORT = objArguments.port || 8080;
console.log(MODO," modo", PORT, "PUERTO")

let randoms=[]
let repetidos = []
const getRandoms = (cantidad)=>{
    if(cantidad){
        for(let i = 0; i<= cantidad;i++){
            num = Math.floor(Math.random()*1000)
            randoms.push(num)
        }
    }else{
        for(let i = 0;i<= 100000;i++){
            num = Math.floor(Math.random()*1000)
            randoms.push(num)
        }
    }
    return randoms
}

if(MODO === "CLUSTER" && cluster.isPrimary){
    const numCpus = os.cpus().length
    for(let i = 0; i<numCpus;i++){
        cluster.fork()
    }
    cluster.on("exit",(worker)=>{
        console.log(`el proceso ${worker.process.pid} fallo`)
        cluster.fork()
    })
}
else{
        //servidor de express
        const server = app.listen(PORT, ()=>console.log(`listening on port ${PORT}`))
        //servidor de websocket y lo conectamos con el servidor de express
        const io = new Server(server);
        io.on("connection",async (socket)=>{

            socket.emit("usuarioLog", userLog)
            //enviar todos los prod cuando se conecte
            socket.emit("products", await productsServices.getAll())
        
            //recibimos el producto del cliente y guardamos
            socket.on("newProduct",async (data)=>{
                await productsServices.save(data)
                //enviamos la lista actualizada a todos los sockets
                io.sockets.emit("products", await productsServices.getAll())
            })
        
            socket.broadcast.emit("newUser")
            socket.emit("historico",await normalizarMensajes())
            socket.on("message",async data => {
                if(historicosMensajes.length==0){
                    nuevoMensaje = {
                        id:1,
                        ...data
                    }
                    console.log(nuevoMensaje)
                    historicosMensajes.push(nuevoMensaje)
                    await mensajesApi.save(historicosMensajes)
                }
                else{
                    nuevoMensaje ={
                        id:historicosMensajes.length+1,
                        ...data
                    }
                    historicosMensajes.push(nuevoMensaje)
                    await mensajesApi.save(historicosMensajes)
                }
                
               await io.sockets.emit("historico",await normalizarMensajes())
               
            })
        })
        

    }   

mongoose.connect(bases.usuarios,{
    useNewUrlParser:true,
    useUnifiedTopology:true,
},(error)=>{
    if(error) return console.log("hubo un error",error)
    console.log("conexion exitosa")
})

app.use(session({
    store: MongoStore.create({
        mongoUrl:bases.sesiones
    }),
    secret:"claveSecreta", //clave de encriptacion de la sesion
    //config para guardar en la memoria del servidor
    resave:false,
    saveUninitialized:false,
}));

app.use(passport.initialize())
app.use(passport.session())
//configuracion de passport
passport.serializeUser((user,done)=>{
    done(null,user.id)
})
passport.deserializeUser((id,done)=>{
    userModel.findById(id,(err,userFound)=>{
        if(err) return done(err)
        return done(null,userFound)
    })
})

//funcion encriptar contraseña
const createHash = (password)=>{
    const hash = bcrypt.hashSync(password,bcrypt.genSaltSync(10))
    return hash
}


passport.use("signupStrategy",new Strategy(
    {
        passReqToCallback:true,
        usernameField:"email"
    },
    (req,username,password,done)=>{
        //logica para recibir usuario
        userModel.findOne({username:username},(err,userFound)=>{
            if(err) return done(err,null,{message:"hubo un error"})
            if(userFound) return done(null,null,{message:"el user ya existe"})
            //guardamos el usuario en db
            const newUser={
                name:req.body.name,
                username:username,
                password:createHash(password)
            }
            userModel.create(newUser,(error,userCreated)=>{
                if(error) return done(error,null,{message:"error al registrar user"})
                return done(null,userCreated)
            })
        })
    }
))

let userLog


app.get("/",(req,res)=>{
    res.render("login")
})
app.get("/home",(req,res)=>{
    if(req.session.user){
        res.render("index")
    }else{
        res.redirect("/login")
    }
})
app.get("/info",(req,res)=>{
    logger.info("procesando info sin zip")
    res.send({"version node":process.version,"sistema opetarivo":process.memoryUsage(),"path ejecucion":process.execPath,"process ID":process.pid,"argumentos entrada":process.argv.slice(2)})
    
})

app.get("/infoZip",compression(),(req,res)=>{
    res.send({"version node":process.version,"sistema opetarivo":process.memoryUsage(),"path ejecucion":process.execPath,"process ID":process.pid,"argumentos entrada":process.argv.slice(2)})
    logger.info("procesando info con zip")
})
app.get("/randomsChild",(req,res)=>{
    const child = fork(path.join(__dirname,"./child.js"))
    num=req.query.cant
    if(num)  child.send(num)
    else child.send(false)
    child.on("message",(respuesta)=>{
        res.send(respuesta)
    })

})
app.get("/randoms",(req,res)=>{
    num=req.query.cant
    let numero
    if(num) numero = num
    else num = 10000
    const resultado = getRandoms(numero)
    let contar = 0
    const arregloOrdenado = resultado.sort()
    for(let i = 0; i<arregloOrdenado.length; i++){
        if(arregloOrdenado[i+1] === arregloOrdenado[i]){
            contar = contar + 1
        }
        if(contar>0){
            const repetido = {"numero": i, "cantidad": contar}
            repetidos.push(repetido)
        }
    }
    res.send(repetidos)

})
app.get("/login",async (req,res)=>{
    logger.warn("usuario por entrar")
    res.render("login")
} )
app.post("/login",(req,res)=>{
    logger.warn("usuario entrante")
    if(req.session.user){
        res.redirect("/home")
    }
    else{
        const user = req.body
    
        userModel.findOne({username:user.email},(err,userFound)=>{
            if(err) res.send(err)
            if(userFound){
                userLog = userFound
                

                if(bcrypt.compareSync(user.password,userFound.password)){
                    req.session.user = user
                    res.redirect("/home")
                }else{
                    res.render("login",{error:"contraseña incorrecta gil"})
                    logger.error("contraseña invalida")
                }
            }else{
                res.render("login",{error:"usuario no registrado en base"})
                logger.error("usuario no registrado")
            }
        })
    }
    
});
app.get("/registro",(req,res)=>{
    if(req.session.user){
        res.redirect("/perfil")
    }else{
        res.render("signup")
    }
});

app.post("/signup",passport.authenticate("signupStrategy",{
    failureRedirect:"/registro",
    failureMessage:true
}),(req,res)=>{
    res.render("signup",{message:"usuario registrado con exito, vaya a iniciar sesion"})
});

app.get("/logout",(req,res)=>{
    req.logOut(err=>{
        if(err) return res.send("error en cerrar sesion")
        req.session.destroy();
        res.redirect("/login")
    }) 
    
});

let historicosMensajes = []

const authorSchema = new schema.Entity("authors",{}, {idAttribute:"email"})
const mensajeSchema = new schema.Entity("mensajes",{author:authorSchema})
const chatSchema = new schema.Entity("chat",{
    mensajes:[mensajeSchema]
},{idAttribute:"id"})


const normalizarData = (data)=>{
    const normalizeData = normalize({id:"chathistory", mensajes:data},chatSchema)
    return normalizeData
}
const normalizarMensajes = async()=>{
    const results = await mensajesApi.getAll()
    const messagesNormalize = normalizarData(results)
    return messagesNormalize

}
normalizarMensajes()
//socket
