'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const request = require('request');
const PAGE_ACCESS_TOKEN = 'EAABzUcPPHf8BAMbZBQPT7H58h2huREPLMzrMd6GvT2ktChTKWXxQWZAGKtXVKzbU1QLpK2Fwt7BJaXg7KQk6p14qba0XhKxBZCHKzssMtnj8IjqbGg1hx9KxGmllCaMCrnww227wAQ2gQn3DyOC7FIji8FxiJj5GZAWFWNFl1gZDZD';
const CLIENT_ACCESS_KEY='5199bb53eb1a448d84d0bd3f2929cf65';
const apiaiApp= require('apiai')(CLIENT_ACCESS_KEY);
const uuid = require('uuid');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended:true }));

const server = app.listen(process.env.PORT || 5000, ()=>{
	console.log("The server is running on %d in %s mode.",server.address().port, app.settings.env);
});


//get request for setting up webhook and Facebook functionality

app.get('/webhook',(req,res)=>{
	console.log(req.query);
	if(req.query['hub.mode'] && req.query['hub.verify_token']==='dev_app21'){
		res.status(200).send(req.query['hub.challenge']);
	}
	else{
		res.status(403).end();
		console.log('Problem with the code!');
	}
});
//trying to get the location
app.post('/ai',(req,res)=>{
	console.log(req.body.id);
});
//Handling the messages done in post
app.post('/webhook',(req,res)=>{
	console.log(req.body);
	if(req.body.object==='page'){
		req.body.entry.forEach((entry)=>{
			entry.messaging.forEach((event)=>{
					console.log(event);
				if(event.message && event.message.text){
					sendMessage(event);
				}
			});
		});
	res.status(200).end();//stopping the bot from replying anymore
	}
});

// function sendMessage(event){
// 	let sender = event.sender.id;
// 	let text = event.message.text;
// 	console.log('*** RECEIVED ***');
//     console.log(event);
// 	request({
// 		url:'https://graph.facebook.com/v2.10/me/messages',
// 		qs:{access_token:PAGE_ACCESS_TOKEN},
// 		method: 'POST',
// 		json: {
// 			recipient:{id: sender},
// 			message:{text:text}
// 		}
// 	},function(error,response){
// 		if(error){
// 			console.log('Error sending message: ', error);
// 	    } else if (response.body.error) {
// 	        console.log('Error: ', response.body.error);
// 	    }
// 	});
// }

//writing a new sendMessage function
function sendMessage(event){
	let sender = event.sender.id;
	let text = event.message.text;
	console.log('Send message is fired!');
	// if (!sessionId.has(sender)) {
	// 	sessionId.set(sender, uuid.v1());
	// }
	let apiai= apiaiApp.textRequest(text,{
		sessionID:"dev_app21"
	});
	apiai.on('response',(response)=>{
		//logic for getting a response from dialogflow
		console.log(response.result);
		let aitext = response.result.fulfillment.speech;

		request({
	      url: 'https://graph.facebook.com/v2.6/me/messages',
	      qs: {access_token: PAGE_ACCESS_TOKEN},
	      method: 'POST',
	      json: {
	        recipient: {id: sender},
	        message: {text: aiText}
	      }
	    }, (error, response) => {
	      if (error) {
	          console.log('Error sending message: ', error);
	      } else if (response.body.error) {
	          console.log('Error: ', response.body.error);
	      }
	    });


	});

	apiai.on('error',(error)=>{
		console.log(error);
	});
	apiai.end();
}





