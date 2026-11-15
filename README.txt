SAMSTRONGER: HOW TO PUT IT ON YOUR IPHONE (GitHub Pages)

You do this yourself in your browser, signed in to your own GitHub account.
It is the same idea as Samslimmer.

WHAT IS IN THIS FOLDER
  index.html             the whole app
  manifest.webmanifest   the app's name and icon for the home screen
  sw.js                  makes the app open with no signal
  icon-180.png, icon-192.png, icon-512.png   the app icon

FIRST TIME
1. On github.com, create a new repository. Name it  samstronger . Choose Public.
   (GitHub Pages on a free account needs a public repository. The app holds no
   personal data: your workouts and photos stay on your phone.)
2. On the new repository page choose "uploading an existing file".
3. Drag in the six files listed above (not this README). Commit.
4. Go to Settings, then Pages. Under "Build and deployment", set Source to
   "Deploy from a branch", Branch to "main" and folder to "/ (root)". Save.
5. Wait a minute or two. The Pages screen shows your address, like
   https://YOURNAME.github.io/samstronger/

ON YOUR IPHONE
6. Open that address in Safari (it must be Safari).
7. Tap the Share button, then "Add to Home Screen". The name Samstronger and
   the Little Samer icon should appear. Tap Add.
8. Open it from the home screen and go through setup.
9. To check offline: open the app once with signal, close it, switch on
   aeroplane mode, and open it again.

GOOD TO KNOW
- The installed app starts empty. Anything you entered through the Claude link
  is stored separately by the phone and does not carry over.
- Use Profile, "Save a backup file" now and then. If you change phone or clear
  Safari's data, "Restore from a file" brings everything back.
- Photos you add are kept inside the app only. Keep the originals in Photos.

UPDATING LATER
- When you get a new version, upload the new index.html and sw.js to the same
  repository (GitHub replaces the old ones). Open the app with signal, close
  it and open it again to get the new version. Your data is not touched.
