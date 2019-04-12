
// The HMAC that works for "flag" and a blank secret
// Golden ticket = f7101d3ad5cb2622672fb15e079d8db3

// The original IV and the AES encrypted blob from any secret
var iv = '1082dd4353281a0644a5e7b0b1ac5556';
var rawString = '6a11d192b2af57911ab81aac398da31fdaf2bd898f56ddf8d7fcc45373d81a0ccd8108c0f1375394560715971a1933ddd93d7d8b0dcf8ed8eddba0c8b82ffc7e'

// Create a buffer from our IV and AES encrypted string
var buffIv = Buffer.from(iv, 'hex');
var buffCrypt = Buffer.from(rawString, 'hex');

// Define what we are looking for, and what we know the plaintext to look like
var attackPayload = 'flag||';
var baseShit = 'md5_';

var hackSize = attackPayload.length;

var theOutput = '';

// Loop over all 16 x 16 possibilities for each of the two spaces
for(var aa = 0; aa<16; ++aa) {
	for(var bb = 0; bb<16; ++bb) {
		// Create a guess from these options and append it to our base shit
		var myGuess = baseShit + aa.toString('16') + bb.toString('16');
		var guessIv = Buffer.from(iv, 'hex');

		// For each character in the string, we are going to XOR
		    // Our guessed character (md5_xx)
		    // The original IV
		    // What we want to change it to (flag||)
		for(var i=0; i<hackSize; ++i) {
			guessIv[i] = 
				myGuess.charCodeAt(i)
				^ buffIv[i]
				^ attackPayload.charCodeAt(i);
		}

		// Convert this new IV to a hex string
		var guessResult = guessIv.toString('hex');
		//console.log(guessResult)
		//console.log(guessIv)

		// Output the guessed IV + the original encrypted string
		theOutput = theOutput + guessResult + rawString + '\n';
	}
}

// Write all the guesses to a file
require('fs').writeFileSync('guesses.txt', theOutput);
