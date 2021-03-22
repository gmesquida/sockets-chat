const { io } = require('../server');
const { Usuarios } = require('../classes/usuarios')

const { crearMensaje } = require('../utils/utilidades')
const usuarios = new Usuarios();

io.on('connection', (client) => {

    // console.log('Usuario conectado');

    client.on('entrarChat', (usuario, callback) => {
        // console.log(usuario);

        if (!usuario.nombre || !usuario.sala) {
            return callback({
                error: true,
                mensaje: 'Son necesarios el nombre y la sala'
            })
        }

        // Nos unimos a la sala
        client.join(usuario.sala);

        let personas = usuarios.agregarPersona(client.id, usuario.nombre, usuario.sala);
        let personasPorSala = usuarios.getPersonasPorSala(usuario.sala);

        //Enviamos un mensaje solo a los usuarios de la sala conectada
        client.broadcast.to(usuario.sala).emit('listaPersona', personasPorSala)

        callback(personasPorSala);

    })

    client.on('disconnect', () => {

        let personaborrada = usuarios.borrarPersona(client.id);

        client.broadcast.to(personaborrada.sala).emit('crearMensaje', crearMensaje('Administrador', `${personaborrada.nombre} abandonó el chat`));
        client.broadcast.to(personaborrada.sala).emit('listaPersona', usuarios.getPersonasPorSala(personaborrada.sala))


    })

    client.on('crearMensaje', (data) => {


        let persona = usuarios.getPersona(client.id);

        let mensaje = crearMensaje(persona.nombre, data.mensaje);
        client.broadcast.to(persona.sala).emit('crearMensaje', mensaje)


    })


    // Mensajes privados
    client.on('mensajePrivado', (data) => {

        let persona = usuarios.getPersona(client.id);
        client.broadcast.to(data.para).emit('mensajePrivado', crearMensaje(persona.nombre, data.mensaje));
    });


});