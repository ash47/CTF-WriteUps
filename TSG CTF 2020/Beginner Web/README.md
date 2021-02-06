Beginner Web
============

### Info
 - Original Link: [http://34.85.124.174:59101/](http://34.85.124.174:59101/)
 - Source Code - [Available Here](beginners_web.tar.gz)
 - Flag: `TSGCTF{Goo00o0o000o000ood_job!_you_are_rEADy_7o_do_m0re_Web}`

### What do we have?
![Landing Page](https://raw.githubusercontent.com/ash47/CTF-WriteUps/master/TSG%20CTF%202020/Beginner%20Web/img/landing.png)
 - We arrive on the `OmniConverter` page which lets us convert a string from regular text to either Base64 or scrypt.
 - We can see our sessionId which is randomly generated, and won't change upon reloading the page. We can regenerate it using incognito, or by clearing our cookies.

![Page In Use](https://raw.githubusercontent.com/ash47/CTF-WriteUps/master/TSG%20CTF%202020/Beginner%20Web/img/landing2.png)
 - We can see that the functions do infact work, we can encode in either Base64 or scrypt.

### What does the request look like?

```http
POST / HTTP/1.1
host: 34.85.124.174:59101
Content-Type: application/x-www-form-urlencoded
Content-Length: 172

converter=base64&input=12345678901234567890
```

 - We can see we have a converter paramater and input parameter to play with. Some how we need to find the flag.

### Source Code - package.json

![Contents of SRC](https://raw.githubusercontent.com/ash47/CTF-WriteUps/master/TSG%20CTF%202020/Beginner%20Web/img/sc_01.png)

 - This is the contents of the source code.
 - We can see the `package.json` and `package-lock.json` files. These are used in web apps to give instructions on what depedencies there are (down to the exact versions) and how to run the app.
 - Let's take a look inside `package.json`:

```json
{
  "name": "beginners_web",
  "private": true,
  "engines": {
    "node": "14.5.0"
  },
  "scripts": {
    "start": "node app.js"
  },
  "dependencies": {
    "ejs": "^3.1.3",
    "fastify": "^2.15.0",
    "fastify-cookie": "^3.6.1",
    "fastify-formbody": "^3.2.0",
    "fastify-session": "^4.0.1",
    "nunjucks": "^3.2.1",
    "point-of-view": "^3.8.0"
  }
}
```

 - We can see that that entry point is simply running `node app.js`, very standard, we can start to look at `app.js` to see how the app operates.
 - We can go off and download NodeJS 14.5.0 on the off chance we need that version, but it probably doesn't matter.
 - With NodeJS installed, we can CD (change directory) into the folder of the source code and type `npm install`, which will download and install everything we need into the `node_modules folder`.
 - We now have not only the app's source code, but the source code of all dependencies.
 - A good approach might be to try the `npm audit` function to check the dependencies for issues, Google each of the dependencies for bugs, or do a manual code review. I did all 3 of these and got no where.

### Source Code - app.js

 - A full copy of the entire source code is available at the top of this write up.
 - We are going to inspect it, and explain it section by section.

#### Lines 1 - 3

```javascript
const fastify = require('fastify');
const nunjucks = require('nunjucks');
const crypto = require('crypto');
```

 - These are just dependencies, crypto is a NodeJS built in Library and likely very robust, the other two libraries are fairly well known, and again, we can review the full source if required via the `node_modules` folder.

#### Lines 6 - 30

```javascript
const converters = {};

const flagConverter = (input, callback) => {
  const flag = '*** CENSORED ***';
  callback(null, flag);
};

const base64Converter = (input, callback) => {
  try {
    const result = Buffer.from(input).toString('base64');
    callback(null, result)
  } catch (error) {
    callback(error);
  }
};

const scryptConverter = (input, callback) => {
  crypto.scrypt(input, 'I like sugar', 64, (error, key) => {
    if (error) {
      callback(error);
    } else {
      callback(null, key.toString('hex'));
    }
  });
};
```

 - These contain of course the flag itself, in our code the flag is censored, and we get a look at how the converts are built
 - These are fairly robust, we can see the user's input is passed in, we can look up the call signatures of each of these and see what happens with certain inputs.
 - Some how we have to figure how to call the `flagConverter` function which would pass the flag back via the callback.
 - How does the program decide which converter to use?

#### Lines 33 - 41

```javascript
const app = fastify();
app.register(require('point-of-view'), {engine: {nunjucks}});
app.register(require('fastify-formbody'));
app.register(require('fastify-cookie'));
app.register(require('fastify-session'), {secret: Math.random().toString(2), cookie: {secure: false}});

app.get('/', async (request, reply) => {
  reply.view('index.html', {sessionId: request.session.sessionId});
});
```

 - This is setting up a webapp in NodeJS using fastify.
 - It configures the rendering engine, form passer and session management.
 - We can see the secret that is used is random each time the app starts, and that the cookie is not secure.
 - The `secure` being set to false simply means the `secure` cookie attribute won't be set, which makes sense as we're using HTTP and not HTTPS.
 - Let's think about the entropy of the session secretly quickly to determine if we can hack / attack it.

```javascript
Math.random().toString(2)
```

 - Here are some sample results, we can just type this into NodeJS directly (it is an intepreter) or just throw it into a web browser console (F12).
   - 0.111100100101001011011010000001111000111000111001101
   - 0.001100001110010011100111011101010110000010100111011
   - 0.1000101010011110000111101010000100101111111011110101
   - 0.1111100100110101101000111001000011101100110100000001
 - There are 51 possible positions here, each of which can have 2 values, we can say that there is 2 to the power of 51 possiblities, or 2.2517998e+15 (2 followed by 15 0s)
 - From this big number, we can assume that it's not a session breaking challenge, that sounds robust enough in terms of entropy.
 - The final part of this stretch of code simply renders the `index.html` page when we visit the `/` of the website.

#### Lines 77 - 81

```javascript
app.setErrorHandler((error, request, reply) => {
  reply.view('index.html', {error, sessionId: request.session.sessionId});
});

app.listen(59101, '0.0.0.0');
````

 - This is the error handling, if an exception is raised at all during runtime, then it will be rendered inside the `index.html` page, instead of crashing the server.
 - This error handling is important to note and will come into play later
 - Finally, we listen on all interfaces (i.e. 0.0.0.0) on the port `59101`

#### Lines 43 - 75

```javascript
app.post('/', async (request, reply) => {
  if (request.body.converter.match(/[FLAG]/)) {
    throw new Error("Don't be evil :)");
  }

  if (request.body.input.length < 10) {
    throw new Error('Too short :(');
  }

  if (request.body.input.length > 1000) {
    throw new Error('Too long :(');
  }

  converters['base64'] = base64Converter;
  converters['scrypt'] = scryptConverter;
  converters[`FLAG_${request.session.sessionId}`] = flagConverter;

  const result = await new Promise((resolve, reject) => {
    converters[request.body.converter](request.body.input, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });

  reply.view('index.html', {
    input: request.body.input,
    result,
    sessionId: request.session.sessionId,
  });
});
```

 - This is a big one, and likely the location of the flaw, let's work our way through from the top down.
 - `app.post('/')` means that if someone does a post request to `/` then it will fire this function / callback.
 - We can see three sets of validation here, which validate the body's parameters, and throw an exception if the validation fails -- which will get rendered via that exception handler we saw above.
   - We can see that the `converter` parameter must not contain the letters `F`, `L`, `A`, or `G` (regex is case sensitive)
   - The input length must be between `10` and `1000` letters

```javascript
  converters['base64'] = base64Converter;
  converters['scrypt'] = scryptConverter;
  converters[`FLAG_${request.session.sessionId}`] = flagConverter;
```

 - Here we can see our first and only reference to the `flagConverter`, we can see that a reference to it is stored inside the `converters` object, and it's based on our sessionId.
 - How does it get called?

```javascript
  const result = await new Promise((resolve, reject) => {
    converters[request.body.converter](request.body.input, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
```

 - Here we go!
 - We can see that the `converter` parameter is used to select which converter from the `converters` object.
 - This is easy, just set `converter` to `FLAG_YOURSESSIONID` and you'll win... ...but you can't have the letters `FLAG` inside of your converter. DOH!
 - It is considered unsafe to use user controllable input inside of the square bracket notation inside an object, not only can you access things stored in the object itself, you can get access to the things stored in the object's prototype (i.e. the class it is based off).
 - Before we continue, it is worth noting that using special syntax, it is possible to generate variables that have different types, such as object or arrays, but that didn't get us anywhere, so we won't discuss it any further.

 - Let's play with our web browser's console:

```javascript
var a = {};
a.
```

 - By typing `a.` into our browser, after setting `a` to be a blank object, the browser will try to autocomplete, as seen below:

![Landing Page](https://raw.githubusercontent.com/ash47/CTF-WriteUps/master/TSG%20CTF%202020/Beginner%20Web/img/sc_02.png)

 - The highlighted items are our main choices.
 - The code itself in the CTF is looking for a function, and each of the highlighted are functions.
 - We know we can control the exact input string that will be passed into each of these, and we can just try them in our browser.
 - Straight off the bat, we can cross out any with any of `FLAG` in them, such as `__defineGetter__` and `__lookupGetter__` due to the `G`.
 - This is the test string I used to determine if we could get any RCE:

```javascript
var a = {};
a.constructor('someinput', (a, b) => {console.log('Function was called!', a, b);})
```

 - I repeat that with each of the possible options, to see if the secondary function would ever get called.
 - Sadly, the secondary function NEVER gets called under any of these conditions.
 - This is a trouble.
 - We are sitting inside of a promise, and the server is waiting for us to resolve that promise.
 - If we can't call that secondary callback function, it's GGWP, the server will sit and never return anything to us, EVER.
 - We need something that can call that secondary function.
 - Let's google the docs of each of those methods, and understand what they do. I'll skip to the one we went with.

 - `__defineSetter__` is a cool little thing, it takes a `string` and a `function` (matches our signature), and will make it so that when a value is set on the given object, the callback will fire.
 - That sounds useful, but what input do we give?!?

```javascript
const converters = {};
```

 - Line 6 is very interesting, as the `converters` object is defined outside the scope of the app handlers itself, that means any changes that we make to it apply forever. This will eat ram, but also means that if we define a setter on it, via the `__defineSetter__` then it will affect other API calls. This is cool!

```javascript
converters[`FLAG_${request.session.sessionId}`] = flagConverter;
```

 - Line 58 is of note here, we can see that there is assignement done, and not only is an assignment done, it's using the function we care about, the function with the FLAG!
 - What if we use the `converter` = `__defineSetter__` with a value of `FLAG_YOURSESSIONID` and run that?
 - The server hangs, and doesn't return anything! That's awesome, but not super useful.
 - How do we make the request return? Well, we need to fire the setter!
 - With another tab, we just need to send any request, using the same sessionId, which will trigger the setter, and ultimately run the callback.
 - What happens here?!?

```javascript
(error, result) => {
  if (error) {
    reject(error);
  } else {
    resolve(result);
  }
}
```

 - Our setter was set to run this function.
 - When a setter is fired, the new value is passed in as the first parameter.
 - The new value is the function which contains the flag:

```javascript
const flagConverter = (input, callback) => {
  const flag = '*** CENSORED ***';
  callback(null, flag);
};
```

 - This means that the `flagConverter` function is now in the `error` parameter of our callback :/
 - We can see that if an error occured, then the result will be rejected, and an exception will be raised.
 - The `error` parameter is considered to be true as there is a function in it.

```javascript
app.setErrorHandler((error, request, reply) => {
  reply.view('index.html', {error, sessionId: request.session.sessionId});
});
```

 - We ultimtaely end up over here, and that exception, which in this case, is the flag function and not actually an exception is rendered into index.html.
 - But, what happens if you render a function?!?

![Magic Happens](https://raw.githubusercontent.com/ash47/CTF-WriteUps/master/TSG%20CTF%202020/Beginner%20Web/img/sc_03.png)

 - Boom! The CODE of the function is rendered, which displays the place holder of the flag!!!
 - Time to try this in PROD and get the flag:

![So close, yet so far](https://raw.githubusercontent.com/ash47/CTF-WriteUps/master/TSG%20CTF%202020/Beginner%20Web/img/sc_04.png)

 - Welcome to the real world. Our exploit, this entire path we went down, and it doesn't work, can't use that in prod. WTF IS GOING ON?
 - I tried exact NodeJS versions, dug a lot into it, and ultimately concluded there must be a WAF in front of it :(

#### WAF Bypass Time

 - Yes, we have a WAF, doh :/
 - The most obvious thing that comes to mind is just URL encode, which failed. Doh.
 - Someone in my team had discovered something critical earlier, that you could change the request from a URL encoded to a JSON blob, and it would still work.
 - As soon as I found out that JSON was allowed, first thing that comes to mind is unicode characters.
 - In some varients of JSON, you can do `\x00` to define a null byte, but this usually fails.
 - In WAY WAY MORE varients of JSON, the `\u0000` is actually valid, you can use this encode characters.
 - A WAF generally won't deal with our JSON encoded magic, so if we escape our payload for JSON using the `\u00xx` syntax, it might work.
 - The easiest way to do this is simply `URL ENCODE` all characters which will result in a `%xx%yy` kind of payload, then replace all of the `%` symbols with `\u00`.
 - Let's try the payload again, using the magic escape:

![Winner Winner Chicken Dinner](https://raw.githubusercontent.com/ash47/CTF-WriteUps/master/TSG%20CTF%202020/Beginner%20Web/img/winner%20winner%20party%20skinner.png)

 - Winner winner chicken dinner!
 - The next day, the WAF was removed, and I cried due to it being made easier for other people. Doh.
