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
        />
      </div>

      <div className="Creator-size">
        Taille :
        <input
          type="number"
          value={cols}
          onChange={event => changeCols(parseInt(event.target.value))}
          className="Creator-input"
        />
        <input
          type="number"
          value={rows}
          onChange={event => changeRows(parseInt(event.target.value))}
          className="Creator-input"
        />
      </div>
      <div>
        <input
          type="button"
          value="Créer"
          onClick={() => props.onCreate(name, rows, cols)}
        />
      </div>
    </div>
  );
}
