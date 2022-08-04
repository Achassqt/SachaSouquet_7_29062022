const Post = require("../models/Post");
const User = require("../models/User");
const ObjectId = require("mongoose").Types.ObjectId;
const fs = require("fs");

exports.createPost = async (req, res) => {
  // console.log(req.body);
  const newPost = new Post(
    req.file
      ? {
          ...req.body,
          imageUrl: `${req.protocol}://${req.get(
            "host"
          )}/uploads/images/posts/${req.file.filename}`,
        }
      : {
          posterId: req.body.posterId,
          message: req.body.message,
          likers: [],
          comments: [],
        }
  );

  try {
    const post = await newPost.save();
    return res.status(201).json(post);
  } catch (err) {
    return res.status(400).send(err);
  }
};

exports.readPost = (req, res) => {
  Post.find((err, docs) => {
    if (!err) res.send(docs);
    else console.log("Error to get data : " + err);
  }).sort({ createdAt: -1 });
};

// exports.updatePost = (req, res) => {
//   if (!ObjectId.isValid(req.params.id))
//     return res.status(400).send("Id unknown : " + req.params.id);

//   const updatedPost = {
//     message: req.body.message,
//   };

//   Post.findOneAndUpdate(
//     req.params.id,
//     { $set: updatedPost },
//     { new: true },
//     (err, docs) => {
//       if (!err) res.send(docs);
//       else console.log("Update error : " + err);
//     }
//   );
// };

exports.updatePost = (req, res) => {
  if (!ObjectId.isValid(req.params.id))
    return res.status(400).send("Id unknown : " + req.params.id);

  // si le post contient une image et que la req aussi, suppression l'ancienne image
  Post.findOne({ _id: req.params.id })
    .then((post) => {
      if (req.file && post.imageUrl !== undefined) {
        const filename = post.imageUrl.split("/uploads/images/posts/")[1];
        fs.unlink(`uploads/images/posts/${filename}`, (err) => {
          if (err) {
            throw err;
          }
        });
      }

      const postObject = req.file
        ? {
            ...req.body,
            imageUrl: `${req.protocol}://${req.get(
              "host"
            )}/uploads/images/posts/${req.file.filename}`,
          }
        : { ...req.body };

      // Mise à jour du post
      Post.findOneAndUpdate(
        { _id: req.params.id },
        { $set: { ...postObject } },
        { new: true }
      )
        .then((post) => res.status(200).json(post))
        .catch((err) => res.status(400).json({ err }));
    })
    .catch((err) => res.status(500).json(err));
};

exports.deletePost = (req, res) => {
  if (!ObjectId.isValid(req.params.id))
    return res.status(400).send("Id unknown : " + req.params.id);

  Post.findOne({ _id: req.params.id })
    .then((post) => {
      if (post.imageUrl) {
        const filename = post.imageUrl.split("/uploads/images/posts")[1];
        fs.unlink(`uploads/images/posts/${filename}`, (err) => {
          if (err) throw err;
        });
      }
      Post.findByIdAndRemove(req.params.id, (err, docs) => {
        if (!err) res.send(docs);
        else console.log("Delete error : " + err);
      });
    })
    .catch((err) => res.status(500).json(err));
};

exports.likes = (req, res) => {
  if (!ObjectId.isValid(req.params.id))
    return res.status(400).send("Id unknown : " + req.params.id);

  try {
    Post.findByIdAndUpdate(
      req.params.id,
      {
        $addToSet: { likers: req.body.id },
      },
      { new: true }
      // (err, docs) => {
      //   if (err) return res.status(400).send(err);
      // }
    ).catch((err) => res.status(400).send(err));

    User.findByIdAndUpdate(
      req.body.id,
      {
        $addToSet: { likes: req.params.id },
      },
      { new: true }
      // (err, docs) => {
      //   if (!err) res.send(docs);
      //   else return res.status(400).send(err);
      // }
    )
      .then((docs) => res.send(docs))
      .catch((err) => res.status(400).send(err));
  } catch (err) {
    return res.status(400).send(err);
  }
};

exports.unlikes = (req, res) => {
  if (!ObjectId.isValid(req.params.id))
    return res.status(400).send("Id unknown : " + req.params.id);

  try {
    Post.findByIdAndUpdate(
      req.params.id,
      {
        $pull: { likers: req.body.id },
      },
      { new: true }
      // (err, docs) => {
      //   if (err) return res.status(400).send(err);
      // }
    ).catch((err) => res.status(400).send(err));

    User.findByIdAndUpdate(
      req.body.id,
      {
        $pull: { likes: req.params.id },
      },
      { new: true }
      // (err, docs) => {
      //   if (!err) res.send(docs);
      //   else return res.status(400).send(err);
      // }
    )
      .then((docs) => res.send(docs))
      .catch((err) => res.status(400).send(err));
  } catch (err) {
    return res.status(400).send(err);
  }
};

exports.commentPost = (req, res) => {
  if (!ObjectId.isValid(req.params.id))
    return res.status(400).send("Id unknown : " + req.params.id);

  try {
    return Post.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          comments: {
            commenterId: req.body.commenterId,
            commenterPseudo: req.body.commenterPseudo,
            text: req.body.text,
            timestamp: new Date().getTime(),
          },
        },
      },
      { new: true },
      (err, docs) => {
        if (!err) return res.send(docs);
        else return res.status(400).send(err);
      }
    );
  } catch (err) {
    return res.status(400).send(err);
  }
};

exports.editCommentPost = (req, res) => {
  if (!ObjectId.isValid(req.params.id))
    return res.status(400).send("Id unknown : " + req.params.id);

  try {
    return Post.findById(req.params.id, (err, docs) => {
      const theComment = docs.comments.find((comment) =>
        comment._id.equals(req.body.commentId)
      );

      if (!theComment) {
        return res.status(404).send("Comment not found");
      } else {
        theComment.text = req.body.text;
      }

      return docs.save((err) => {
        if (!err) return res.status(200).send(docs);
        return res.status(500).send(err);
      });
    });
  } catch (err) {
    return res.status(400).send(err);
  }
};

exports.deleteCommentPost = (req, res) => {
  if (!ObjectId.isValid(req.params.id))
    return res.status(400).send("Id unknown : " + req.params.id);

  try {
    return Post.findByIdAndUpdate(
      req.params.id,
      {
        $pull: {
          comments: {
            _id: req.body.commentId,
          },
        },
      },
      { new: true },
      (err, docs) => {
        if (!err) return res.send(docs);
        else return res.status(400).send(err);
      }
    );
  } catch (err) {
    return res.status(400).send(err);
  }
};
