import { useQuery } from "@apollo/client";
import { ALL_BOOKS, ME } from "../queries";
import { useState } from "react";

const Books = ({ show, recommendedOnly }) => {
  const result = useQuery(ALL_BOOKS);
  const userResult = useQuery(ME);
  const [selectedGenre, setSelectedGenre] = useState("all");

  if (!show) {
    return null;
  }

  if (result.loading || (recommendedOnly && userResult.loading)) {
    return <div>loading...</div>;
  }

  const books = result.data.allBooks;
  const genres = [...new Set(books.flatMap((book) => book.genres))];

  let booksToShow;
  if (recommendedOnly) {
    const favoriteGenre = userResult.data.me.favoriteGenre;
    booksToShow = books.filter((book) => book.genres.includes(favoriteGenre));
  } else {
    booksToShow =
      selectedGenre === "all"
        ? books
        : books.filter((book) => book.genres.includes(selectedGenre));
  }

  return (
    <div>
      {recommendedOnly ? (
        <>
          <h2>recommendations</h2>
          <p>
            books in your favorite genre{" "}
            <strong>{userResult.data.me.favoriteGenre}</strong>
          </p>
        </>
      ) : (
        <h2>books</h2>
      )}

      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {booksToShow.map((a) => (
            <tr key={a.title}>
              <td>{a.title}</td>
              <td>{a.author.name}</td>
              <td>{a.published}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {!recommendedOnly && (
        <div>
          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              style={{
                border: selectedGenre === genre ? "2px solid blue" : "",
              }}
            >
              {genre}
            </button>
          ))}
          <button
            onClick={() => setSelectedGenre("all")}
            style={{
              border: selectedGenre === "all" ? "2px solid blue" : "",
            }}
          >
            all genres
          </button>
        </div>
      )}
    </div>
  );
};

export default Books;
