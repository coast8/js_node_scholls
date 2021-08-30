




/*
|--------------------------------------------------------------------------
| Tutorial 3 layers
|--------------------------------------------------------------------------
| layered structure
| 
*/





// ==========================
// File Router.js
// ==========================
//


const { Router } = require('express');
const DevController = require('./app/controllers/DevController');
const SearchController = require('./app/controllers/SearchController');

const routes = Router();

routes.get('/devs', DevController.index);
routes.post('/devs', DevController.store);
routes.put('/devs/:id', DevController.update);
routes.delete('/devs/:id', DevController.destroy);

routes.get('/search', SearchController.index);


module.exports = routes;




// ==========================
// File Controller.js
// ==========================
//

const parseStringAsArray = require('../utils/parseStringAsArray');
const pinPointLocation = require('../utils/pinPointLocation');
const { findConnections, sendMessage } = require('../../websocket');
const { listDevs,
    validateUsername,
    getUserData,
    createDev,
    updateDevData,
    findDevToDelete,
    deleteDev
    } = require('../services/DevService');


module.exports = {

    async index(req, res) {
        const devs = await listDevs()
        return res.json(devs);
    },

    async store(req, res) {
        const { github_username, techs, latitude, longitude } = req.body;
        let dev = await validateUsername(github_username);

        if (!dev) {
            const response = await getUserData(github_username);
            const { name = login, avatar_url, bio } = response.data;
            const techsArray = parseStringAsArray(techs);
            const location = pinPointLocation(longitude, latitude);
    
            dev = await createDev(
                github_username,
                name,
                avatar_url,
                bio,
                techsArray,
                location)
    
            // filtrar as conexções que estão há no mx 10km de distÂncia 
            // e que o novo dev tenha pelo menos uma das techs
            const sendSocketMessageTo = findConnections({ latitude, longitude }, techsArray)
            sendMessage(sendSocketMessageTo, 'newDev', dev)
        }
    
        return res.json(dev);
    },

    async update(req, res) {
        //nome avatar bio localização tecnologias
        const { id } = req.params;
        const { name, longitude, latitude, techs, bio } = req.body;

        const techsArray = parseStringAsArray(techs);
        const location = pinPointLocation(longitude, latitude);
        const dev = await updateDevData(id, name, bio, techsArray, location);

        return res.json(dev);
    },

    async destroy(req, res) {
        const { id } = req.params;
        const devExists = await findDevToDelete(id)
        const result = devExists ? { message: `O usuário ${devExists.name} foi removido com sucesso!` } : { message: 'Usuário não encontrado!' }
    
        if (devExists) {
          await deleteDev(id)
        }
    
        return res.json(result)
    }

};




// ==========================
// File Service.js
// ==========================
//

const github = require('../../config/github');
const Dev = require('../models/Dev');


module.exports = {

	async listDevs(req, res) {
	    const devs = await Dev.find();
	    return devs;
	  },

	async validateUsername(github_username) {
	    const dev = Dev.findOne({ github_username })
	    return dev
	},

	async getUserData(github_username) {
	    const response = await github.get(`/${github_username}`);
	    return response;
	},

	async createDev(github_username, name, avatar_url, bio, techs, location) {
	    const techsLowerCase = techs.map(tech => tech.toLowerCase())
	    dev = await Dev.create({
	      github_username,
	      name,
	      avatar_url,
	      bio,
	      techs: techsLowerCase,
	      location
	    })
	    return dev;
	},

	async updateDevData(id, name, bio, techs, location) {
	    //nome avatar bio localização tecnologias
	    const techsLowerCase = techs.map(tech => tech.toLowerCase())
	    const dev = await Dev.findByIdAndUpdate(id, {
	      name,
	      bio,
	      techs: techsLowerCase,
	      location
	    });
	    return dev;
	},

	async findDevToDelete(id) {
	    const dev = Dev.findById(id);
	    return dev
	},

	async deleteDev(id) {
	    await Dev.findByIdAndDelete(id)
	},

}

