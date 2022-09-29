const express = require('express');
const app = express();
const exphbs = require('express-handlebars');
const session = require('express-session');
const flash = require('connect-flash');
const handlebars = exphbs.create({});
const mongoose = require('mongoose');
const path = require('path');
const passport = require("passport");
const moment = require("moment");
const bcrypt = require("bcryptjs")

// Models
const { postagens } = require("./models/Postagem")

// Passport de autenticacao
require("./config/auth")(passport)

// ENV com dados do Mongo
require('dotenv').config();

// Rotas
const postagem = require('./routes/postagem');
const usuario = require('./routes/usuario');
const categoria = require('./routes/categoria');
const { usuarios } = require('./models/Usuario');

// Encoded
app.use(express.urlencoded({extended: true})); 
app.use(express.json());

// Sessao
app.use(session({
    secret:"blog-em-node-js",
    resave: true,
    saveUninitialized: true
}))

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Template Engine
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

// Public Functions
app.use(express.static(path.join( __dirname, '/public' )));

// Diretorio das Imagens
const imagemPath = path.join(__dirname, '/uploads');
app.use("/uploads",express.static(imagemPath));

// Middleware
app.use((req,res,next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error =req.flash("error")
    res.locals.user = req.user || null;
    res.locals.moment = moment;
    next();
});
// esse app.use tem q ficar abaixo ao middleware, o middleware ele é um tipo de processamento que faz antes de de fato a requisição chegar ao metodo rest
// Rotas
app.use('/admin', postagem)
app.use('/usuario', usuario)
app.use('/admin', categoria)

// Conecation MongoDB
const Schema = mongoose.Schema;
mongoose.connect(process.env.MONGO_DB,
{useNewUrlParser: true})
.then(()=>{
    console.log('Mongo conectado')
}).catch((err)=> {
    console.log(err)
    console.log('Erro ao conectar ao Mongo online')
});

// Porta de acesso
const PORT = process.env.PORT || 5005

// Home page
app.get('/', (req, res) => {
    postagens.find().populate("categoria").sort({date:"desc"}).lean().then((postagens) =>{
        res.render('home', { postagens: postagens })
    }).catch((err) => {
        res.redirect("/404")
    })
});

app.get('/:id', (req, res) => {
    postagens.findOne({slug:req.params.id}).lean().then((postagens) =>{
        res.render('ler', { postagens: postagens })
    }).catch((err) => {
        res.redirect("/404")
    })
});

app.get("/404", (req,res) => {
    res.send('Erro 404')
})

app.post("/createnewauthadmin", async (req, res) => {
    await usuarios.create({
        nome: "GuilhermeNotFound404",
        email: "leonadokof123@gmail.com",
        senha: await bcrypt.hash("guilherme123", 12),
    })
    res.status(201).send()
})

app.listen(PORT, () => {
    console.log('Escutando na porta: ' + PORT )
})
