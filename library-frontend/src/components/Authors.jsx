import { useQuery, useMutation } from "@apollo/client";
import { ALL_AUTHORS, UPDATE_AUTHOR } from "../queries";
import { useState, useEffect } from "react";
const Authors = (props) => {
  const result = useQuery(ALL_AUTHORS);
  const [name, setName] = useState("");
  const [born, setBorn] = useState("");

  const [updateAuthor, updateResult] = useMutation(UPDATE_AUTHOR, {
    refetchQueries: [{ query: ALL_AUTHORS }],
  });

  useEffect(() => {
    if (updateResult.data && updateResult.data.editAuthor === null) {
      props.setError("person not found");
    }
  }, [updateResult.data]);

  if (!props.show) {
    return null;
  }
  if (result.loading) {
    return <div>loading...</div>;
  }
  const authors = result.data.allAuthors;

  const handleSubmit = (event) => {
    event.preventDefault();
    updateAuthor({ variables: { name, born: parseInt(born) } });
    setName("");
    setBorn("");
  };

  return (
    <div>
      <div>
        <h2>authors</h2>
        <table>
          <tbody>
            <tr>
              <th></th>
              <th>born</th>
              <th>books</th>
            </tr>
            {authors.map((a) => (
              <tr key={a.name}>
                <td>{a.name}</td>
                <td>{a.born}</td>
                <td>{a.bookCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <h2>Set birthyear</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label>Name</label>
            <select onChange={({ target }) => setName(target.value)}>
              {authors.map((a) => (
                <option key={a.name} value={a.name}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Born</label>
            <input
              type="number"
              value={born}
              onChange={({ target }) => setBorn(target.value)}
            />
          </div>
          <button type="submit">Update author</button>
        </form>
      </div>
    </div>
  );
};

export default Authors;
