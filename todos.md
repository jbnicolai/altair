Altair updates
----

a lot has progressed. it runs now I think.

1. Review gettingstarted.md
2. Please try and install it from scratch over and over, think of ways to do it better and better (maybe something
like curl http;//altair.io/go.js | node or whatever cool shit banana pants we can do).

    Getting people up and going quickly is key to adoption.

3. I had to change the way dojo/Deferred works so it could suppress writing rejects() to the console... I need them
swapped out for altair/Deferred in our code. But, done one at a time with the unit tests run each time (it'll make
 debugging easier.

4. ***SUPER FUN ONE LOLZ*** I need help from everyone willing on this one. Setup jslint in phpstorm to match what I have
https://www.dropbox.com/s/42du6nwaj120ih7/Screenshot%202014-02-21%2023.29.57.png and go through each file and fix
the errors. I am devving with these settings now, so it will not be an issue going forward =)

    These are the nails that not many will see.

    Note: I can't seem to get the "use strict" errors to stop on mine... ignore them. adding "use strict" blows up dojo =(

5. Find out which "use strict"; rules dojo breaks and investigate why. Share in altair skype chat as you find them


