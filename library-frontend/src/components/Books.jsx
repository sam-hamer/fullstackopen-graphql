import { useQuery } from "@apollo/client";
import { ALL_BOOKS, ME } from "../queries";
import { useState } from "react";

const Books = ({ show, recommendedOnly }) => {
  const userResult = useQuery(ME);
  const [selectedGenre, setSelectedGenre] = useState("all");

  const genre = recommendedOnly
    ? userResult.data?.me?.favoriteGenre
    : selectedGenre === "all"
    ? null
    : selectedGenre;

  const result = useQuery(ALL_BOOKS, {
    variables: { genre },
  });

  const allBooksResult = useQuery(ALL_BOOKS);

  if (!show) {
    return null;
  }

  if (
    result.loading ||
    allBooksResult.loading ||
    (recommendedOnly && userResult.loading)
  ) {
    return <div>loading...</div>;
  }

  const books = result.data.allBooks;
  const genres = [
    ...new Set(allBooksResult.data.allBooks.flatMap((book) => book.genres)),
  ];

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
          {books.map((a) => (
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
