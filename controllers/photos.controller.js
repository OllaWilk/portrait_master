const Photo = require('../models/photo.model');
const Voter = require('../models/Voter.model');
const requestIp = require('request-ip');

function escape(test) {
  return text.replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {

  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;

    if(title && author && email && file) { // if fields are not empty...

      const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
      const fileExtention = fileName.split('.').slice(-1)[0];

      const pattern = new RegExp(/(([A-Za-zżźćńółęąśŻŹĆĄŚĘŁÓŃ]|[0-9]|\s|\.|\,)*)/, 'g');
      const matchedAuthor = author.match(pattern).join('');
      const matchedTitle = title.match(pattern).join('');

      const mailRegEx = new RegExp(/^[0-9a-z_.-]+@[0-9a-z.-]+\.[a-z]{2,3}$/, 'i');
      const matchedEmail = email.match(mailRegEx).join('');

      if (fileExtention === 'png' || fileExtention === 'jpg' || fileExtention === 'gif') {
        const newPhoto = new Photo({ title: matchedTitle, author: matchedAuthor, email: matchedEmail, src: fileName, votes: 0 });
        await newPhoto.save(); // ...save new photo in DB
        res.json(newPhoto);
      } else {
        throw new Error('Wrong input!');
      }
    } else {
      throw new Error('Wrong input!');
    }

  } catch(err) {
    res.status(500).json(err);
  }

};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {

  try {
    res.json(await Photo.find());
  } catch(err) {
    res.status(500).json(err);
  }

};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {

  try {
    const photoToUpdate = await Photo.findOne({ _id: req.params.id });
    if (!photoToUpdate) res.status(404).json({ message: 'Not found' });
    else {

      const user = await Voter.findOne({ user: req.clientIp });
      if(user) {
        const voteUpdate = await Voter.findOne({$and: [{user: req.clientIp, votes: req.params.id}] });

        if(!voteUpdate) {
          await Voter.updateOne({ user: req.clientIp }, { $push: { votes: [req.params.id] } });
          const photoToUpdate = await Photo.findOne({ _id: req.params.id });
          photoToUpdate.votes++;
          photoToUpdate.save();
          res.send({ message: 'OK' });
        } else {
          res.status(500).json(err);
        }

      } else {

        const newVoter = new Voter({ user: req.clientIp, votes: [req.params.id] });
        await newVoter.save();
        const photoToUpdate = await Photo.findOne({ _id: req.params.id });
        photoToUpdate.votes++;
        photoToUpdate.save();
        res.send({  message: 'OK' });
      }
      
    };

  } catch(err) {
    res.status(500).json(err);
  }
};
