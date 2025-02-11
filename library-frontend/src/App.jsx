import { useState } from "react";
import Authors from "./components/Authors";
import Books from "./components/Books";
import NewBook from "./components/NewBook";
import { useSubscription, useApolloClient } from "@apollo/client";
import LoginForm from "./components/LoginForm";
import { BOOK_ADDED, ALL_BOOKS } from "./queries";

const App = () => {
  const [page, setPage] = useState("authors");
  const [errorMessage, setErrorMessage] = useState(null);
  const [token, setToken] = useState(null);
  const client = useApolloClient();

  const notify = (message) => {
    setErrorMessage(message);
    setTimeout(() => {
      setErrorMessage(null);
    }, 5000);
  };

  const resetPage = () => {
    setPage("authors");
  };

  const logout = () => {
    setToken(null);
    localStorage.clear();
    client.resetStore();
  };

  const updateCache = (addedBook) => {
    const includedIn = (set, object) =>
      set.map((b) => b.id).includes(object.id);

    const dataInStore = client.readQuery({
      query: ALL_BOOKS,
      variables: { genre: null },
    });

    if (!includedIn(dataInStore.allBooks, addedBook)) {
      client.writeQuery({
        query: ALL_BOOKS,
        variables: { genre: null },
        data: {
          allBooks: dataInStore.allBooks.concat(addedBook),
        },
      });
    }

    addedBook.genres.forEach((genre) => {
      const dataInStore = client.readQuery({
        query: ALL_BOOKS,
        variables: { genre },
      });

      if (dataInStore && !includedIn(dataInStore.allBooks, addedBook)) {
        client.writeQuery({
          query: ALL_BOOKS,
          variables: { genre },
          data: {
            allBooks: dataInStore.allBooks.concat(addedBook),
          },
        });
      }
    });
  };

  useSubscription(BOOK_ADDED, {
    onData: ({ data }) => {
      const addedBook = data.data.bookAdded;
      notify(`${addedBook.title} added`);
      updateCache(addedBook);
    },
  });

  return (
    <div>
      <div>
        <button onClick={() => setPage("authors")}>authors</button>
        <button onClick={() => setPage("books")}>books</button>
        {token ? (
          <>
            <button onClick={() => setPage("add")}>add book</button>
            <button onClick={() => setPage("recommend")}>recommend</button>
            <button onClick={logout}>logout</button>
          </>
        ) : (
          <button onClick={() => setPage("login")}>login</button>
        )}
      </div>

      <Notify errorMessage={errorMessage} />
      <Authors show={page === "authors"} setError={notify} />

      <Books show={page === "books"} />
      <Books show={page === "recommend"} recommendedOnly={true} />

      <NewBook show={page === "add"} notify={notify} />
      <LoginForm
        show={page === "login"}
        setToken={setToken}
        setError={notify}
        resetPage={resetPage}
      />
    </div>
  );
};

const Notify = ({ errorMessage }) => {
  if (!errorMessage) {
    return null;
  }
  return <div style={{ color: "red" }}>{errorMessage}</div>;
};

export default App;
