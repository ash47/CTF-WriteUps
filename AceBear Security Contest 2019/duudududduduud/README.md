duudududduduud
==============

### Info
 - Original Link: [http://54.169.92.223/](http://54.169.92.223/)
 - Hint: `backup.bak?`
 - Flag: `AceBear{From_Crypt0_m1sus3_t0_Rc3_______}`

### What do we have?

![Landing Page](https://raw.githubusercontent.com/ash47/CTF-WriteUps/master/AceBear%20Security%20Contest%202019/duudududduduud/01%20-%20login%20screen.png)
 - We arrive at a page that asks us to login

 - We are able to register an account
 - We are able to login with that account
 - The website reminds us that we are not an admin, clearly we need to login as an admin

### Let's solve it

![Backup File](https://raw.githubusercontent.com/ash47/CTF-WriteUps/master/AceBear%20Security%20Contest%202019/duudududduduud/02%20-%20backup.bak.png)
 - Naturally, we use the hint, and of course, find a `backup.bak` file
 - All of the code is here, it's just a matter of figuring out what's what
 - I've kept a copy of the code which can be found [here](https://github.com/ash47/CTF-WriteUps/tree/master/AceBear%20Security%20Contest%202019/duudududduduud/backup/web01) (note that I removed a .git directory that appeared to be not relevant, and was 60MB)

![Login Logic](https://raw.githubusercontent.com/ash47/CTF-WriteUps/master/AceBear%20Security%20Contest%202019/duudududduduud/03%20-%20login%20logic.png)
 - Naturally, us wanting to login as an admin and all, we take a look at `login.php`
 - On line `10` we can see there is an SQL injection via the username parameter
 - The username is fed in via the `session_remember` cookie
 - The cookie is actually fed into a `check_cookie` function

![AES Stuff](https://raw.githubusercontent.com/ash47/CTF-WriteUps/master/AceBear%20Security%20Contest%202019/duudududduduud/04%20-%20aes%20stuff.png)
 - This quickly leads us to `lib/connection.php`
 - The first thing we notice is line `10` which is clearly where our flag will be -- We need to read the contents of this file
 - Up next, we can see our `check_cookie` function
   - This function takes 2 arguments, a string to decrypt and the secret key, which we don't know
   - The first argument is based64 decoded, and then AES decrypted, most notable here is that the IV and the KEY are the same -- if we can get the original IV, we can get the key

![Critical Flaw](https://raw.githubusercontent.com/ash47/CTF-WriteUps/master/AceBear%20Security%20Contest%202019/duudududduduud/05%20-%20critical%20flaw.png)
 - Let me draw your attension back to `login.php` and show you a critical flaw here
 - If the SQL query doesn't return EXACTLY 1 row, be that for any reason, then the server will output the AES decrypted string :O
 - Worst case, we can brute force our way to victory, best case, we can do some AES CBC magic

![AES CBC Diagram](https://raw.githubusercontent.com/ash47/CTF-WriteUps/master/AceBear%20Security%20Contest%202019/duudududduduud/06%20-%20classic%20aes%20cbc%20diagram.png)
 - Here's a diagram of how AES CBC actually works, and I'll explain the important parts of decrpytion here
 - AES is a block cipher, meaning that it breaks all of your data into fixed blocks, and encrypts them block by block
 - Starting from the second block onwards, the decryption happens as follows:
   - The block is decrypted using the secret key
   - This generates some garbage text
   - The garbage text is then XORed with the CIPHER TEXT of the previous block (which we fully know, obviously) which results in the plaintext
   - It stands to reason then, if we modify the cipher text of the 1st block, it will directly affect the contents of the second block

![Simon Smells](https://raw.githubusercontent.com/ash47/CTF-WriteUps/master/AceBear%20Security%20Contest%202019/duudududduduud/07%20-%20simon%20smells.png)
 - I put this theory into practice and wrote a small script that allows you to modify the ciphertext of the first block in a special way that lets you control the plaintext of the second block
 - As you can see, I was able to make the decrypted contents of the second block read `Simom Smells`
 - From here, I can easily put an SQL injection payload into the second block
 - The main issue is, I need a MUCH LONGER query than what can fit into a single block
 - My next idea, is, I can inject into every SECOND block (i.e. blocks 2, 4, 6, 8, etc)
 - If I inject part of an SQL injection statement into the first block, and the end it with a `/*`, it won't matter what the third block decrypts to
 - In the forth block, I can start it with a `*/` put some more SQL injection magic, then end it with a `/*` and continue this process until I have a full payload, and then ultimately end it with a `--` to comment out the rest of the junk

![Payload works](https://raw.githubusercontent.com/ash47/CTF-WriteUps/master/AceBear%20Security%20Contest%202019/duudududduduud/08%20-%20payload%20works.png)
 - I sent the server a bunch of `A`s and got the decrypted form of that for use within my script
 - I wrote a small script in NodeJS to generate this token for me which can be viewed [here](https://github.com/ash47/CTF-WriteUps/blob/master/AceBear%20Security%20Contest%202019/duudududduduud/web01_tool.js)
 - The token ultimately injected the following into the blocks: `' UNION       /*XXXXXXXXXXXXXXXX*/ SELECT     /*XXXXXXXXXXXXXXXX*/ 'lol',1 -- /*XXXXXXXXXXXXXXXX*/a/*`
 - Note that the `XXXXXXXXXXXXXXXX` are blocks that I couldn't control
 - We do a union select with username = `lol` and `admin` = `1`, we know the syntax of the SQL command from reviewing the source code of the `login.php` from earlier
 - The server allocates us a cookie which gives us admin access

![Confirmed as admin](https://raw.githubusercontent.com/ash47/CTF-WriteUps/master/AceBear%20Security%20Contest%202019/duudududduduud/09%20-%20confirmed%20admin.png)
 - We use the cookie and confirm that we are actually an admin
 - We get a hint that says something isn't implemented right for admins
 - Naturally, we notice the upload button at the top of the screen

![Upload Page](https://raw.githubusercontent.com/ash47/CTF-WriteUps/master/AceBear%20Security%20Contest%202019/duudududduduud/10%20-%20upload%20page.png)
 - We browse to the upload page and confirm that it's working, nice! We truly are an admin!

![Code Review](https://raw.githubusercontent.com/ash47/CTF-WriteUps/master/AceBear%20Security%20Contest%202019/duudududduduud/11%20-%20critical%20code.png)
 - We have the code, let's just see how it works
 - Line `47` shows us that it looks for a `manifest.json` file
 - Line `48` shows us that there must be a parameter within the `manifest.json` file that is `type` = `h4x0r` and we must have `name` set to anything
 - We can trivially make this file, and then we should be able to upload ANYTHING at that point `{"type": "h4x0r","name": "pwned"}`
 - Add any web shell you please

![Got the flag](https://raw.githubusercontent.com/ash47/CTF-WriteUps/master/AceBear%20Security%20Contest%202019/duudududduduud/12%20-%20got%20the%20flag.png)
 - With a webshell uploaded, it's just a matter of running the `cat` command with the correct path to the orignal `lib/connection.php` file
 - We can see that the key is in here, and the flag itself

### Something extra
 - You can technically recover the original IV via this poor implementation of AES CBC via XORing the right things together with a specially crafted payload
 - I thought it was more fun doing an SQL injection attack like this, and may attack would still work even if the IV wasn't the same as the key
 - This was super cool and fun
