'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const request = require('request');
const PAGE_ACCESS_TOKEN = 'EAABzUcPPHf8BAMbZBQPT7H58h2huREPLMzrMd6GvT2ktChTKWXxQWZAGKtXVKzbU1QLpK2Fwt7BJaXg7KQk6p14qba0XhKxBZCHKzssMtnj8IjqbGg1hx9KxGmllCaMCrnww227wAQ2gQn3DyOC7FIji8FxiJj5GZAWFWNFl1gZDZD';
const CLIENT_ACCESS_KEY='5199bb53eb1a448d84d0bd3f2929cf65';
const PAGE_GRAPH_TOKEN ='126795014675967|Q5WFJ6-MgS1fo-vD_nSqNJbwcpA';
const dflow= require('apiai')('5199bb53eb1a448d84d0bd3f2929cf65');
var gDistance = require('google-distance');
var data= require('./data');
var graph = require('fbgraph');
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


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

//post request that handles findin distance between two places
//writing a new sendMessage function for bot and dialogflow interaction
function sendMessage(event){
	let sender = event.sender.id;
	let text = event.message.text;
	// if (!sessionId.has(sender)) {
	// 	sessionId.set(sender, uuid.v1());
	// }
	let apiai= dflow.textRequest(text,{
		sessionId:"dev_app"
	});
	apiai.on('response',(response)=>{
		//logic for getting a response from dialogflow
		console.log(response.result);
		var currentLocation,distance = Number.MAX_VALUE,shortestCity,distanceArr={};
		let aitext = response.result.fulfillment.speech;
		//for information and carousel message
		if(response.result.action === 'INFO'){
			
			var posts={};
			graph.setAccessToken(PAGE_GRAPH_TOKEN);
			//run this in a separate script
			graph.extendAccessToken({
		        "client_id":126795014675967, 
		        "client_secret":'ea5f67afe7081459425cdfd301751a72'
		    }, function (err, facebookRes) {
		       console.log('extended token ',facebookRes);
		    });
			
			
				if(response.result.parameters['geo-city'] !== '' && response.result.parameters['geo-city'] !== undefined){
							let infoCity = response.result.parameters['geo-city'];
							let profile = data[infoCity];
							let groupId = profile['id'];
							let requestURL = 'https://graph.facebook.com/v2.10/'+groupId+'/feed';
							graph.get(requestURL, function(err, res) {
								if(err){
									request({
									      url: 'https://graph.facebook.com/v2.10/me/messages',
									      qs: {access_token: PAGE_ACCESS_TOKEN},
									      method: 'POST',
									      json: {
									        recipient: {id: sender},
									        message: {text: 'The city either has a private group, in which case, kindly join it, or there might not be a developer circle in the city. Please Enter your city name to find the nearest developer circle or apply for a new one in your city.'}
									      }
									    }, (error, response) => {
									      if (error) {
									          console.log('Error sending message: ', error);
									      } else if (response.body.error) {
									          console.log('Error: ', response.body.error);
									      }
									    });
								}
								else{
									posts = res;
									//making the carousel message
									request({
									      url: 'https://graph.facebook.com/v2.10/me/messages',
									      qs: {access_token: PAGE_ACCESS_TOKEN},
									      method: 'POST',
									      json: {
									        "recipient":{
											    "id":sender
											  },
											  "message":{
											    "attachment":{
											      "type":"template",
											      "payload":{
											        "template_type":"generic",
											        "elements":[
											           {
											            "title":posts.data[0]['story'],
											            "image_url":"https://static.xx.fbcdn.net/rsrc.php/v3/yV/r/BhqIEprNoBN.png",
											            "subtitle":posts.data[0]['message'],
											            "buttons":[
											              {
											                "type":"web_url",
											                "url":profile['link'],
											                "title":"Visit circle"
											              }             
											            ]      
											          },
											          {
											            "title":posts.data[1]['story'],
											            "image_url":"https://static.xx.fbcdn.net/rsrc.php/v3/yV/r/BhqIEprNoBN.png",
											            "subtitle":posts.data[1]['message'],
											            "buttons":[
											              {
											                "type":"web_url",
											                "url":profile['link'],
											                "title":"Visit circle"
											              }             
											            ]      
											          },
											          {
											            "title":posts.data[2]['story'],
											            "image_url":"https://static.xx.fbcdn.net/rsrc.php/v3/yV/r/BhqIEprNoBN.png",
											            "subtitle":posts.data[2]['message'],
											            "buttons":[
											              {
											                "type":"web_url",
											                "url":profile['link'],
											                "title":"Visit circle"
											              }             
											            ]      
											          }
											        ]
											      }
											    }
											  }
									      }
									    }, (error, response) => {
									      if (error) {
									          console.log('Error sending message: ', error);
									      } else if (response.body.error) {
									          console.log('Error: ', response.body.error);
									      }
									    });
								}
			  				
				
							});
				}
				else{
					request({
				      url: 'https://graph.facebook.com/v2.10/me/messages',
				      qs: {access_token: PAGE_ACCESS_TOKEN},
				      method: 'POST',
				      json: {
				        recipient: {id: sender},
				        message: {text: aitext}
				      }
				    }, (error, response) => {
				      if (error) {
				          console.log('Error sending message: ', error);
				      } else if (response.body.error) {
				          console.log('Error: ', response.body.error);
				      }
				    });
				}

			

		}
		else{
			if(response.result.parameters['geo-city'] !== undefined && response.result.parameters['geo-city'] !== ''){
				console.log("got the geocity");
				currentLocation = response.result.parameters['geo-city'];
				request({
			      url: 'https://graph.facebook.com/v2.10/me/messages',
			      qs: {access_token: PAGE_ACCESS_TOKEN},
			      method: 'POST',
			      json: {
			        recipient: {id: sender},
			        message: {text: 'One moment please...'}
			      }
			    }, (error, response) => {
			      if (error) {
			          console.log('Error sending message: ', error);
			      } else if (response.body.error) {
			          console.log('Error: ', response.body.error);
			      }
			    });
			    for (var variable in data){
			    	gDistance.get(
					  {
					    origin: currentLocation,
					    destination: variable
					  },
					  function(err, resp) {
					    if (err) return console.log('err');
					    else{
					    	distanceArr[resp.destination.split(',')[0]] = resp.distanceValue/1000;
					    	console.log(resp.destination.split(',')[0],resp.distanceValue/1000);
					    }
					});

					

			    }
			    sleep(3000).then(() => {
				    console.log(distanceArr);
				    for (var i in distanceArr){
					if(distance > distanceArr[i]){
						distance = distanceArr[i];
						shortestCity = i;

					}
					
				}
				var lshort=data[shortestCity];
				var city = "The nearest Dev Circle is "+shortestCity+'. Here is the page link:'+ lshort['link'];
				request({
			      url: 'https://graph.facebook.com/v2.10/me/messages',
			      qs: {access_token: PAGE_ACCESS_TOKEN},
			      method: 'POST',
			      json: {
			        recipient: {id: sender},
			        message: {text: city}
			      }
			    }, (error, response) => {
			      if (error) {
			          console.log('Error sending message: ', error);
			      } else if (response.body.error) {
			          console.log('Error: ', response.body.error);
			      }
			    });
				});
				


			}
			else if(response.result.parameters['geo-country'] !== undefined && (response.result.parameters['geo-city'] === undefined || response.result.parameters['geo-city']==='')){
				console.log("got the geocountry");
				request({
			      url: 'https://graph.facebook.com/v2.10/me/messages',
			      qs: {access_token: PAGE_ACCESS_TOKEN},
			      method: 'POST',
			      json: {
			        recipient: {id: sender},
			        message: {text: 'Please enter the city you live in...'}
			      }
			    }, (error, response) => {
			      if (error) {
			          console.log('Error sending message: ', error);
			      } else if (response.body.error) {
			          console.log('Error: ', response.body.error);
			      }
			    });
			}
			
			else{
				request({
			      url: 'https://graph.facebook.com/v2.10/me/messages',
			      qs: {access_token: PAGE_ACCESS_TOKEN},
			      method: 'POST',
			      json: {
			        recipient: {id: sender},
			        message: {text: aitext}
			      }
			    }, (error, response) => {
			      if (error) {
			          console.log('Error sending message: ', error);
			      } else if (response.body.error) {
			          console.log('Error: ', response.body.error);
			      }
			    });
			}
		}
		

	});

	apiai.on('error',(error)=>{
		console.log(error);
	});
	apiai.end();
}
