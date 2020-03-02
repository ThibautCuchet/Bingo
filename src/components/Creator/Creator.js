import React from "react";
import "./Creator.css";

export default function Creator(props) {
  const [name, changeName] = React.useState("");
  const [rows, changeRows] = React.useState(3);
  const [cols, changeCols] = React.useState(3);

  return (
    <div className="Creator-body">
      <div className="Creator-name">
        Nom :
        <input
          type="text"
          value={name}
          onChange={event => changeName(event.target.value)}
          style={{ marginLeft: 10 }}
        />
      </div>

      <div className="Creator-size">
        Taille :
        <input
          type="number"
          value={cols}
          onChange={event => changeCols(parseInt(event.target.value))}
          className="Creator-input"
          style={{ marginLeft: 10, width: "3em" }}
        />
        <input
          type="number"
          value={rows}
          onChange={event => changeRows(parseInt(event.target.value))}
          className="Creator-input"
          style={{ width: "3em" }}
        />
      </div>
      <div className="Creator-action">
        <input
          type="button"
          value="Créer"
          onClick={() => props.onCreate(name, rows, cols)}
        />
      </div>
    </div>
  );
}
