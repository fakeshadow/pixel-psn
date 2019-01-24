### Requirement(tested):
nodejs 10.14.2

npm 6.4.1

### Setup:
1. clone this repo
2. go into the folder and run 

   npm install
3. Rename .env_sample to .env and change whatever params you want
4. npm start


### API endpoints:

*check https://tusticles.com/psn-php/first_login.html for how to get uuid and 2FA

####login 
> GET   /login/your_uuid/your_2FA

####get profile                                 
> GET   /profile/user_psn_id

####get trophy summary
> GET   /trophy/start_number/limit_number/user_psn_id

####get trophy by game
> GET   /trophies/getgame/user_psn_id/game_npId

####get all trophies
> GET   /trophies/getall/user_psn_id/wait_time
>     
> *wait_time is in milliseconds. It's there to prevent throtting your PSN API acess. It's safe to set it above 1000 or even higher if you have multiple request at the same time.

#### send message
> POST  /message/send/
>
> *accept urlencoded body (set your post header 'Content-Type' to 'application/x-www-form-urlencoded')
>
> Required keys and values:  
>
> 'threadId': 'The threadId you want to post message to'
>
> 'message': 'The text content of your message'
>
> 'type': '1-4' (1.text; 2.image; 3.audio; 4.sticker?)  *only type 1 support for now.

####check message
>GET    /message/new
>
>auto update threads lastmodified date per minute.

####cross find thread or people
>POST   /message/find
>
> *accept urlencoded body (set your post header 'Content-Type' to 'application/x-www-form-urlencoded')
>
> Accept keys and values(*Doesn't accept both):  
>
> 'threadId': 'find all members' Id in that thread'
>
> 'onlineId': 'find all threads this onlineId is in'




### issue:

JS is async by nature so it's very easy to throttle your PSN API by accident. Be ware that happen and restart the app when you are at it.

Your refresh token is stored in cert/tokens.json. It's safe to disable cert.save() function if you don't feel like to store it.

Refresh token may expire and you have to login again manually.

Poor error handling. Please start an issue if you can't figure out the problem.

Process may halt when auto refreshing token.

Messy code.


### todo:
> fully function social features.
> databse support.
> blockchain implement.


