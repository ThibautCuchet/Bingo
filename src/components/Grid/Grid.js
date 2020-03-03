import React from "react";

import "./Grid.css";

export default class Grid extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      edit: false
    };
  }

  checkRow(i) {
    return this.props.bingoGrid[i].some(element => !element.checked);
  }

  checkCol(j) {
    return this.props.bingoGrid.some(element => !element[j].checked);
  }

  checkDiagonale(i, j) {
    if (i == j) {
      for (let n = 0; n < this.props.bingoGrid.length; n++) {
        if (!this.props.bingoGrid[n][n].checked) return false;
      }
      return true;
    } else if (i + j == this.props.bingoGrid.length - 1) {
      for (let n = 0; n < this.props.bingoGrid.length; n++) {
        if (
          !this.props.bingoGrid[n][this.props.bingoGrid.length - 1 - n].checked
        )
          return false;
      }
      return true;
    }
    return false;
  }

  checkBingo(i, j) {
    if (!this.checkRow(i) || !this.checkCol(j) || this.checkDiagonale(i, j))
      return { backgroundColor: "grey" };
  }

  render() {
    return (
      <div>
        {this.props.streamer ? (
          <div className="Grid-action">
            {this.state.edit ? (
              <input
                type="button"
                value="Enregistrer"
                onClick={() => this.setState({ edit: false })}
              />
            ) : (
              <input
                type="button"
                value="Modifier"
                onClick={() => this.setState({ edit: true })}
              />
            )}
            <input
              type="button"
              value="Réinitialiser"
              onClick={() => this.props.handleReset()}
            />
            <input
              type="button"
              value="Mélanger"
              onClick={() => this.props.handleShuffle()}
            />
          </div>
        ) : (
          <div />
        )}
        <div
          className={
            this.props.streamer || this.props.type === "mobile"
              ? "Grid-table"
              : "Grid-table-component"
          }
        >
          {this.props.bingoGrid.map((row, i) => (
            <div className="Grid-rows" key={i}>
              {row.map((cell, j) => (
                <div
                  className={cell.checked ? "Grid-cell-checked" : "Grid-cell"}
                  key={j}
                  onClick={() => {
                    !this.state.edit &&
                      this.props.streamer &&
                      this.props.handleCheck(i, j);
                  }}
                  style={{
                    ...this.checkBingo(i, j)
                  }}
                >
                  <div className="Grid-title">
                    {this.state.edit ? (
                      <textarea
                        key={i + this.state.name + j}
                        value={cell.name}
                        onChange={event =>
                          this.props.handleChange(i, j, event.target.value)
                        }
                        cols={9}
                        rows={4}
                      />
                    ) : (
                      cell.name
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }
}
