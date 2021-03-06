//Importation des packages de node 
const jwt = require('jsonwebtoken');
const fs = require('fs'); //filesystem

//Importation du model message
const models = require('../models');
const Message = models.Message;
const User = models.User;
const Comment = models.Comment;
const Like = models.Like;

//Importation des middlewares
const token = require("../middleware/token");

//Création du POST pour créer un message
exports.createMessage = (req, res) => {
  let attachement = "";
  //récupération du userId dnas le token
  let userId = token.getUserId(req);
  console.log("userId:" + userId);
  //Récupération du user grace à l'userId du token
  let user = User.findOne({ where: { id: userId } })
    .then(user => {
      //condition s'il y a une image jointe
      if (req.file) {
        //récupération de l'url de l'image
        attachement = `${req.protocol}://${req.get("host")}/images/${req.file.filename}`;
      }
      //s'il n'y a pas d'image
      else {
        attachement = req.body.attachement;
      }
      //création du message
      Message.create({
        include: [{ model: User }],
        content: req.body.content,
        attachement: attachement,
        UserId: user.id
      })
        .then(() => res.status(201).json({ message: 'Message créé' }))
        .catch(error => res.status(400).json({ message: error.message }));

    })
    .catch(error => { res.status(403).json({ message: error.message }) });

},


  //Création du GET pour afficher tous les messages
  exports.allMessage = (req, res, next) => {
    //fonction find qui permet de trouver tous les messages
    Message.findAll({
      order: [["id", "DESC"]],
      include: [
        User,
        Like,
        {
          model: Comment,
          include : User,
        },
      ],
    })

      .then((response) => res.status(200).json(response)
      )
      .catch(error => res.status(400).json({ message: error.message }));
  },

  //Création du GET pour afficher un message
  exports.oneMessage = (req, res, next) => {
    //fonction find qui permet de trouver un message
    Message.findOne({ 
      where: { id: req.params.id } ,
      include: [ User, Comment, Like]
    })
      .then((response) => res.status(200).json(response))
      .catch(error => res.status(400).json({ message: error.message }));
  },

  //Création du PUT pour modifier un message
  exports.modifyMessage = (req, res, next) => {
    //récupération du userId dnas le token
    let userId = token.getUserId(req);
    //fonction find qui permet de trouver un message
    Message.findOne({ where: {id: req.params.id }})
      .then(message => {
        //Vérification de l'userId en comparaison avec celui du message
        if (userId != message.userId) {
          res.status(403).json({ message: "Seul l'utilisateur qui a créé le message peut le modifier" })
            .catch((error) => res.status(400).json({ message: error.message }));
        } else {
          //récupération des données avec ou sans images
          const messageObject = req.file ?
            {
              ...req.body,
              attachement: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
            } : { ...req.body};
          //fonction qui permet de mettre à jour un message
          Message.update({ ...messageObject, id: req.params.id }, { where: { id: req.params.id } })
            .then(() => res.status(200).json({ message: 'Message modifié !' }))
            .catch(error => res.status(400).json({ message: error.message }));
        }
      })
      .catch(error => res.status(500).json({ message: error.message }));
  };

//Création du DELETE pour supprimer un message 
exports.deleteMessage = (req, res, next) => {
  //fonction find qui permet de trouver un message
  Message.findOne({ where: {id: req.params.id }})
    .then(message => {
      //Vérification de l'userId ou adminId en comparaison avec celui du message
      if (! token.getAuthorization(req, message.userId)) {
        console.log("user de message: " + message.userId)
        res.status(403).json({ message: "Seul l'utilisateur qui a créé le message peut le supprimer" })
          .catch((error) => res.status(400).json({ message: error.message }));
      } else {
        let filename = "";
        //s'il y a un fichier
        if (message.attachement !== null) {
          //récupération du nom du fichier via un split de l'url
          filename = message.attachement.split('/images/')[1];
        }
        //suppression du fichier
        fs.unlink(`images/${filename}`, () => {
          //fonction qui permet de supprimer un utilisateur
          Message.destroy({ where: { id: req.params.id } })
            .then(() => res.status(200).json({ message: 'Message supprimé !' }))
            .catch(error => res.status(400).json({ message: error.message }));
        });
      }
    })
    .catch(error => res.status(500).json({ message: error.message }));
};