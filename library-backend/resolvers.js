const Book = require("./models/book");
const Author = require("./models/author");
const User = require("./models/user");
const jwt = require("jsonwebtoken");
const { PubSub } = require("graphql-subscriptions");
const pubsub = new PubSub();

const resolvers = {
  Query: {
    bookCount: async () => Book.collection.countDocuments(),
    allBooks: async (root, args) => {
      let query = {};

      if (args.author) {
        const author = await Author.findOne({ name: args.author });
        if (author) {
          query.author = author._id;
        }
      }

      if (args.genre) {
        query.genres = { $in: [args.genre] };
      }

      const books = await Book.find(query)
        .populate("author", { name: 1, born: 1 })
        .select("-__v");

      return books.map((book) => ({
        ...book.toObject(),
        id: book._id,
        author: {
          ...book.author.toObject(),
          id: book.author._id,
          bookCount: books.filter(
            (b) => b.author._id.toString() === book.author._id.toString()
          ).length,
        },
      }));
    },
    allAuthors: async () => {
      const authors = await Author.find({}).select("-__v");
      const books = await Book.find({}).select("-__v");

      return authors.map((author) => {
        const bookCount = books.filter(
          (book) => book.author.toString() === author._id.toString()
        ).length;

        return {
          ...author.toObject(),
          id: author._id,
          bookCount,
        };
      });
    },
    me: (root, args, context) => {
      return context.currentUser;
    },
  },
  Mutation: {
    addBook: async (root, args, context) => {
      let author = await Author.findOne({ name: args.author });
      const currentUser = context.currentUser;
      if (!currentUser) {
        throw new GraphQLError("not authenticated", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }
      if (args.title.length < 4) {
        throw new GraphQLError(
          "Book title must be at least 4 characters long",
          {
            extensions: { code: "BAD_USER_INPUT" },
          }
        );
      }

      if (args.author.length < 4) {
        throw new GraphQLError(
          "Author name must be at least 4 characters long",
          {
            extensions: { code: "BAD_USER_INPUT" },
          }
        );
      }
      if (!author) {
        author = new Author({ name: args.author });
        await author.save();
      }
      const newBook = new Book({ ...args, author: author._id });
      await newBook.save();

      const populatedBook = await Book.findById(newBook._id).populate("author");

      const returnedBook = {
        ...populatedBook.toObject(),
        id: populatedBook._id,
        author: {
          ...populatedBook.author.toObject(),
          id: populatedBook.author._id,
          bookCount: await Book.countDocuments({
            author: populatedBook.author._id,
          }),
        },
      };

      pubsub.publish("BOOK_ADDED", { bookAdded: returnedBook });

      return returnedBook;
    },
    editAuthor: async (root, args, context) => {
      const currentUser = context.currentUser;
      if (!currentUser) {
        throw new GraphQLError("not authenticated", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }
      const author = await Author.findOne({ name: args.name });
      if (!author) {
        return null;
      }
      author.born = args.born;
      await author.save();
      return author;
    },
    createUser: async (root, args) => {
      const user = new User({
        username: args.username,
        favoriteGenre: args.favoriteGenre,
      });

      return user.save().catch((error) => {
        throw new GraphQLError("Creating the user failed", {
          extensions: {
            code: "BAD_USER_INPUT",
            invalidArgs: args.username,
            error,
          },
        });
      });
    },
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username });

      if (!user || args.password !== "secret") {
        throw new GraphQLError("wrong credentials", {
          extensions: {
            code: "BAD_USER_INPUT",
          },
        });
      }

      const userForToken = {
        username: user.username,
        id: user._id,
      };

      return { value: jwt.sign(userForToken, process.env.JWT_SECRET) };
    },
  },
  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterableIterator("BOOK_ADDED"),
    },
  },
};

module.exports = resolvers;
