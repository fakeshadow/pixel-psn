### Requirement(tested):
nodejs 10.14.2

npm 6.4.1

### Setup:
1. clone this repo

2. go into the folder and run 

   npm install

3. Rename .env_sample to .env and change whatever params you want

4. npm start

### Addtional Setup:
1. install mongoDB

2. create a databse called "psn" and setup a user password for it.

3. change the DATABASE setting in .env file according to your previous setting.

### API endpoints:

*check https://tusticles.com/psn-php/first_login.html for how to get uuid and 2FA


#### login 
> POST   /login
>
> * accept urlencoded body (set your post header 'Content-Type' to 'application/x-www-form-urlencoded')
>
> Required keys and values:  
>
> 'uuId': 'The uuId you get from above tutorial'
>
> 'twoFA': 'as above'


#### get profile                                 
> GET   /profile/user_psn_id


#### get trophy summary
> GET   /trophy/start_number/limit_number/user_psn_id
>
>will return a local result if database have the complete cache and start&&limit numbers are not used


#### get trophy by game
> GET   /trophies/getgame/user_psn_id/user_npId/game_npId
>
>will return a local result if database have cache of this game

#### get all trophies
> GET   /trophies/getall/user_psn_id
>     
> * Background worker will handle most of the work later and the results will cached into database.


#### send message
> POST  /message/send
>
> * accept multipart/form-data (set your post header 'Content-Type' to 'multipart/form-data')
>
> Required keys and values:  
>
> 'threadId': 'The threadId you want to post message to'
>
> 'message': 'The text content of your message'
>
> 'content': 'put your data here. leave it blank if you only send text message'
>
> 'type': '1-4' (1.text; 2.image; 3.audio; 4.sticker?)  
>
> *only type 1 and 2 support for now.(image size is limited to near 20kb png form.)

#### send message direct to onlineId
> POST  /message/send/direct
> 
> * usually it's not optimal to send message directly. As you may form more threads than you need to and make managing and caching harder.
> mostly the same as regular send message. Using local memory cache to decide if a new thread need to be found. It may introduce some errors but will save some api calls.
>
> Required keys and values:  
>
> 'onlineId': 'The onlineId you want to post message to' (id need to be exact match including uper lower caps and symbos)
>
> 'message': 'The text content of your message'
>
> 'content': 'put your data here. leave it blank if you only send text message'
>
> 'type': '1-4' (1.text; 2.image; 3.audio; 4.sticker?)  
>
> *only type 1 and 2 support for now.(image size is limited to near 20kb png form.)



#### recieve messages
>POST   /message/receive
>
> * accept urlencoded body (set your post header 'Content-Type' to 'application/x-www-form-urlencoded')
>
> Required keys and values:  
>
> 'threadId': 'The threadId you want to get messages from'
>
> 'count': 'The count of messages you want to receive' (limit is set to 100)


#### check message
>GET    /message/new
>
>auto update threads lastmodified date per minute.


#### cross find thread or people
>POST   /message/find
>
> * accept urlencoded body (set your post header 'Content-Type' to 'application/x-www-form-urlencoded')
>
> Accept keys and values(*Doesn't accept both):  
>
> 'threadId': 'find all members' Id in that thread'
>
> 'onlineId': 'find all threads this onlineId is in' (id need to be exact match including uper lower caps and symbos)


#### leave a message thread
>POST   /message/leave
>
> * accept urlencoded body (set your post header 'Content-Type' to 'application/x-www-form-urlencoded')
>
> Accept keys and values:  
>
> 'threadId': 'leave this message thread'


#### get user activities
>POST   /profile/activity        
>
> * accept urlencoded body (set your post header 'Content-Type' to 'application/x-www-form-urlencoded').
>currently have bug and can only retrive the right result on the first try.
>
> Accept keys and values:  
>
> 'onlineId': 'the user you want to check activities'
>
> 'page': 'start with 1'
>
> 'type': 'feed or news'


#### find store items:
>GET    /store/search/item_name
>
>* will return all related games info and cache them into the database.
>change your store region and language in .env for now. Will add other stores later when all store features are ready



### issue:

JS is async by nature so it's very easy to throttle your PSN API by accident. Be ware that happen and restart the app when you are at it.

Your refresh token is stored in token/tokens.json. It's safe to disable cert.save() function if you don't feel like to store it.

Refresh token may expire and you have to login again manually.

Poor error handling. Please start an issue if you can't figure out the problem.

Process may halt when auto refreshing token.

Messy code.


### todo:
> docker and scalable multiple instance support.
> basic front end.
> blockchain implement.

> fork form-data to add custom content-length


