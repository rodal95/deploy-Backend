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
process.on("message",numero =>{
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
    
    process.send(repetidos)
})
