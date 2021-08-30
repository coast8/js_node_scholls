

/*
|--------------------------------------------------------------------------
| Tutorial 2 module.exports
|--------------------------------------------------------------------------
| use async await
| 
*/



// ==========================
// File Router.js
// ==========================
//



module.exports = function (application,router) {

	router.route('/event/:eventId').get(function (req, res, next) {
		application.app.controllers.events.getEvent(application, req, res);
	});
	
}



// ==========================
// File Controller.js
// ==========================
//

module.exports.getEvent = async function (application, req, res) {

	var queryEvent = await Events.findOne({ Id: req.params.eventId }, 'Id SportId League Status StartDate Manual Participants -_id');

	if (queryEvent) {
		res.status(200).send({ event: queryEvent });
	} else {
		res.status(204).send();
	}

}