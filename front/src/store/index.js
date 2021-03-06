///// Importation des moduldes de Vue /////
import { createStore } from 'vuex'
const axios = require('axios');

///// Récupération des informations du User /////
let user = localStorage.getItem('user');
if (!user){
    user= {
        userId: -1,
        token: '',
    };
} else {
    try{
        user= JSON.parse(user);
        axios.defaults.headers.common['Authorization'] = `token ${user.token}`;
    } catch (ex) {
        user= {
            userId: -1,
            token: '',
        };
    }
}

////// Création du store /////
const store = createStore({
    //déclération de variables
    state: {
        status: '',
        uploadFile: null,

    // USER //
        user : user,
        userInfos: {
            lastname: '',
            firstname: '',
            email: '',
            bio: '',
            avatar: '',
            isAdmin: false,
        },

    // MESSAGE //
        //Tous les messages
        messages: [],
        //Un message
        messageInfos: {
            content: '',
            attachement: '',
            createdAt: '',
            User:{
                avatar:'', 
                firstname :'', 
                lastname: '',
            },
            Comments: [],
            Likes: [],
         },
    // COMMENTAIRE //
        //Tous les commentaires
        comments: [],
        commentInfos: {
            content: '',
         },
    },

    getters: {
        //Formatage de la date
        humanizeDate: function(state) {
            state
            return function(dateIso) {
                if (!dateIso) {
                    return ""
                }
                const dateToHumanize = new Date(dateIso);
                const dateHumanized = new Intl.DateTimeFormat('fr-FR').format(dateToHumanize);
                const timeHumanized = new Intl.DateTimeFormat('fr-FR', {timeStyle: 'short' }).format(dateToHumanize);
                return `${dateHumanized.replaceAll('/', '.')} à ${timeHumanized}`;
            }
        }
    },
    mutations: {
        //MAJ du status du state
        setStatus: function (state, status) {
            state.status = status;
        },
        //Récupération des images du site et stockage dans state
        uploadImage (state, {image}) {
            state.uploadFile= image;
        },
    ////////////////// MUTATIONS DE USER ////////////////// 
        //MAJ du state user 
        logUser: function (state, user) {
            //Rajoute un token dans le header de toutes les requêtes
            axios.defaults.headers.common['Authorization'] = `token ${user.token}`;
            console.log(user.token);
            //Envoi des données utilisateurs dans le local storage
            localStorage.setItem('user', JSON.stringify(user));
            //MAJ le state de user de l'utilisateur connecté
            state.user = user;
        },
        //MAJ du state userInfos
        userInfos: function(state, userInfos) {
            state.userInfos = userInfos;
        },
        //MAJ du state userInfos après MAJ profile par user
        updateUserField (state, {newValue, fieldName }) {
            state.userInfos[fieldName] = newValue
        },
    ////////////////// MUTATIONS DE MESSAGE ////////////////// 
        //MAJ du state messageInfos après MAJ updateMessage
        updateMessageField (state, {newValue, fieldName }) {
            state.messageInfos[fieldName] = newValue
            //console.log(fieldName)
            //console.log(newValue)
        },    
        //MAJ du state messages 
        messages: function(state, messages) {
            //Récupération du User connecté
            const loggedUserId = state.user.userId;
            for (const message of messages) {
                //Détrerminé si l'utilisateur à déjà liké un post (affichage couleur)
                let messageLikedByUser = false;
                for (const like of message.Likes) {
                    if (like.userId == loggedUserId) {
                         messageLikedByUser = true;
                         break;
                    }
                }
                //Champ éphémère pour l'interface -> récupération des messages "liké" par l'utilisateur dans Accueil.vue
                message.liked = messageLikedByUser;
                //Déterminé si un utilisateur est "owner" d'un commentaire
                for (const comment of message.Comments) {
                    //Champ éphémère -> affichage des boutons de modif de l'user connecté pour les commentaires dans Accueil.vue
                    comment.owner = comment.userId == loggedUserId;
                }
                //Champ éphémère -> affichage des boutons de modif de l'user connecté pour les messages dans Accueil.vue
                message.owner = message.userId == loggedUserId;
            }
            //MAJ du state messages
            state.messages = messages;
        },
        //MAJ du state d'un message (messageInfos)
        messageInfos: function(state, messageInfos) {
            //Récupération du User connecté
            const loggedUserId = state.user.userId;
            //Détrerminé si l'utilisateur à déjà liké un post (affichage couleur)
             let messageLikedByUser = false;
                for (const like of messageInfos.Likes) {
                    if (like.userId == loggedUserId) {
                         messageLikedByUser = true;
                         break;
                    }
                }
                //Champ éphémère pour l'interface -> récupération des messages "liké" par l'utilisateur dans MessageGetOne.vue
                messageInfos.liked = messageLikedByUser; 
                //Champ éphémère -> affichage des boutons de modif de l'user connecté pour les commentaires dans MessageGetOne.vue
                messageInfos.owner = messageInfos.userId == loggedUserId;
                //MAJ du state messageInfos
                state.messageInfos = messageInfos;
        },
    ////////////////// MUTATIONS DE COMMENTAIRE ////////////////// 
        //MAJ du state commentInfos après MAJ updateComment
        updateCommentField (state, {newValue, fieldName }) {
            state.commentInfos[fieldName] = newValue,
            console.log(fieldName),
            console.log(newValue)
        },    
        //MAJ du state comments
        comments: function(state, comments) {
            const loggedUserId = state.user.userId;
            for (const comment of comments) {
                // Champ éphémère pour affichage des boutons de modif de l'user connecté
                comment.owner = comment.userId == loggedUserId;
                state.comments = comments;  
            } 
            
        },
    },
    actions: {
    ///////////////////  ACTIONS USER ////////////////// 
        //Fonction d'inscription de l'utilisateur
        signup : ({commit}, userInfos) => {
            return new Promise ((resolve, reject) => {
                commit('setStatus', 'loading');
                console.log(userInfos);
                axios.post('http://localhost:3000/api/user/signup', userInfos)
                .then(response => {
                        console.log(response),
                        commit('setStatus', 'created');
                        resolve(response);
                })
               .catch(error => {
                    console.log(error),
                    commit('setStatus', 'error_create');
                    reject(error);
                })
            })
            
        },
        //Fonction de connexion de l'utilisateur
        login : ({commit}, userInfos ) => {
            return new Promise ((resolve, reject) => {
                commit('setStatus', 'loading');
                console.log(userInfos);
                axios.post('http://localhost:3000/api/user/login', userInfos)
                .then(response => {
                        console.log(response),
                        commit('setStatus', '');
                        commit('logUser', response.data);
                        resolve(response);
                })
               .catch(error => {
                    console.log(error),
                    commit('setStatus', 'error_login');
                    reject(error);
                })
            })
            
        },
        //Fonction de récupération des infos utilisateur
        getUserInfos : ({commit}, userId)=> {
            //console.log(commit);
            //console.log(userId);
            axios.get(`http://localhost:3000/api/user/profil/${userId}`)
            .then(response => {
                //console.log(response);
                commit('userInfos', response.data);
            })
            .catch(error => {
                console.log(error);
            })
        },
        //Fonction de modification du profil utilisateur
        modifyProfile : ({commit, state}) => {
            let userId = state.user.userId;
            let formData = new FormData();
            if (state.uploadFile) {
                formData.append("image", state.uploadFile);
            }
            for (let [fieldName, fieldValue] of Object.entries(state.userInfos))
            {
                formData.append(fieldName, fieldValue); //push les valeurs
            }
            return new Promise ((resolve, reject) => {
                commit;
                axios.put(`http://localhost:3000/api/user/profil/${userId}`, formData, {headers: {
                    'Content-Type': 'multipart/form-data'
                  }})
                .then(response => {
                    console.log(response)
                    resolve(response);
                })
               .catch(error => {
                    console.log(error.message)
                    reject(error.message);
                })
            })
            
        },
        //Fonction de suppression de l'utilisateur
        deleteProfile : ({commit, state}) => {
            console.log(state.user.userId)
            console.log(commit)
            let userId = state.user.userId;
            return new Promise ((resolve, reject) => {
                commit;
                axios.delete(`http://localhost:3000/api/user/profil/${userId}`, state.userInfos)
                .then(response => {
                    //console.log(response)
                    resolve(response);
                })
               .catch(error => {
                    console.log(error)
                    reject(error);
                })
            })  
        },

    ///////////////////  ACTIONS MESSAGE ////////////////// 
        //Fonction de récupération de tous les messages
        getAllMessages : ({commit})=> {
            axios.get(`http://localhost:3000/api/message/`)
                .then(response => {
                    commit('messages', response.data);
                    console.log(response.data)
                })
                .catch(error => {
                    console.log(error);
                })
        },
        //Fonction de récupération des infos d'un message
        getOneMessage : ({commit}, messageId)=> {
            axios.get(`http://localhost:3000/api/message/${messageId}`)
                .then(response => {
                    console.log(messageId);
                    commit('messageInfos', response.data);
                    console.log(response.data)
                })
                .catch(error => {
                    console.log(error);
                })
            },
        //Fonction de création d'un nouveau message
        newMessage : ({commit, state}, messageInfos) => {
            return new Promise ((resolve, reject) => {
                console.log(messageInfos);
                let formData = new FormData();
                if (state.uploadFile) {
                    formData.append("image", state.uploadFile);
                }
                for (let [fieldName, fieldValue] of Object.entries(messageInfos)) {
                    formData.append(fieldName, fieldValue);
                }
                axios.post('http://localhost:3000/api/message/new', formData, {headers: {
                    'Content-Type': 'multipart/form-data'
                  }})
                .then(response => {
                        console.log(response),
                        commit('setStatus', 'created');
                        resolve(response);
                })
               .catch(error => {
                    console.log(error),
                    commit('setStatus', 'error_create');
                    reject(error);
                })
            })
            
        },
        //Fonction de modification d'un message
        updateMessage : ({commit, state}, messageId) => {
            let formData = new FormData();
            if (state.uploadFile) {
                formData.append("image", state.uploadFile);
            }
            for (let [fieldName, fieldValue] of Object.entries(state.messageInfos)) {
                formData.append(fieldName, fieldValue);
            }
            return new Promise ((resolve, reject) => {
            commit;
            axios.put(`http://localhost:3000/api/message/${messageId}`, formData, {headers: {
                'Content-Type': 'multipart/form-data'
              }})
                .then(response => {
                    console.log(response)
                    resolve(response);
                })
               .catch(error => {
                    console.log(error.message)
                    reject(error.message);
                })
            })
        },
        //Fonction de suppression d'un message
        deleteMessage : ({commit}, messageId) => {
            console.log(commit)
            console.log('id du message est :' + messageId)
            return new Promise ((resolve, reject) => {
                commit;
                axios.delete(`http://localhost:3000/api/message/${messageId}`)
                .then(response => {
                    //console.log(response)
                    resolve(response);
                })
               .catch(error => {
                    console.log(error.message)
                    reject(error.message);
                })
            })  
        },
    ///////////////////  ACTIONS COMMENTAIRE ////////////////// 
        //Fonction de récupération de tous les commentaires
        getAllComments : ({commit}, messageId)=> {
            axios.get(`http://localhost:3000/api/message/${messageId}/comment`)
                .then(response => {
                    commit('comments', response.data);
                    console.log(response.data)
                })
                .catch(error => {
                    console.log(error);
                })
        },
        //Fonction de création d'un nouveau commentaire
        newComment : ({commit}, {valeurContent, messageId}) => {
            return new Promise ((resolve, reject) => {
                axios.post(`http://localhost:3000/api/message/${messageId}/comment/new`,{content : valeurContent})
                .then(response => {
                        console.log(response),
                        commit('setStatus', 'created');
                        resolve(response);
                })
               .catch(error => {
                    console.log(error),
                    commit('setStatus', 'error_create');
                    reject(error);
                })
            })
            
        },
        //Fonction de modification d'un commentaire
        updateComment : ({commit, state}, {messageId, commentId}) => {
            console.log(commit)
            console.log(state)
            console.log('id du message est :' + messageId + 'id du comment est :' + commentId)
            return new Promise ((resolve, reject) => {
            commit;
            axios.put(`http://localhost:3000/api/message/${messageId}/comment/${commentId}`, state.commentInfos)
                .then(response => {
                    console.log(response)
                    resolve(response);
                })
               .catch(error => {
                    console.log(error.message)
                    reject(error.message);
                })
            })
        },
        //Fonction de suppression d'un commentaire
        deleteComment : ({commit}, {messageId, commentId}) => {
            console.log(commit)
            console.log('id du message est :' + messageId + 'id du comment est :' + commentId)
            return new Promise ((resolve, reject) => {
                commit;
                axios.delete(`http://localhost:3000/api/message/${messageId}/comment/${commentId}`)
                .then(response => {
                    //console.log(response)
                    resolve(response);
                })
               .catch(error => {
                    console.log(error.message)
                    reject(error.message);
                })
            }) 
        },
    ///////////////////  ACTIONS LIKE ////////////////// 
        //Création d'un like
        like : ({commit, state}, messageId) => {
            console.log(commit)
            console.log('Like ici')
            console.log('id du message est :' + messageId + 'id du user est :' + state.user.userId)
            return new Promise ((resolve, reject) => {
                commit;
                axios.post(`http://localhost:3000/api/message/${messageId}/like`)
                .then(response => {
                    console.log(response)
                    resolve(response);
                })
               .catch(error => {
                    console.log(error.message)
                    reject(error.message);
                })
            }) 
        },
        //Annulation d'un like
        unlike : ({commit, state}, messageId) => {
            console.log(commit)
            console.log('Unlike ici')
            console.log('id du message est :' + messageId + 'id du user est :' + state.user.userId)
            return new Promise ((resolve, reject) => {
                commit;
                axios.delete(`http://localhost:3000/api/message/${messageId}/like`)
                .then(response => {
                    console.log(response)
                    resolve(response);
                })
               .catch(error => {
                    console.log(error.message)
                    reject(error.message);
                })
            }) 
        }
    }   
})
//Permet d'accéder au store depuis la console
window.store = store;

//Exportation du store
export default store;