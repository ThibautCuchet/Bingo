import React from "react";

import "./Grid.css";

import saveIcon from "../../util/icons/save.svg";
import editIcon from "../../util/icons/edit.svg";
import emptyIcon from "../../util/icons/empty.svg";
import shuffleIcon from "../../util/icons/shuffle.svg";

export default class Grid extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      edit: false
    };
  }

  checkRow(i) {
    return this.props.bingoGrid[i].some(element => !element.validate);
  }

  checkCol(j) {
    return this.props.bingoGrid.some(element => !element[j].validate);
  }

  checkDiagonale(i, j) {
    if (i == j) {
      for (let n = 0; n < this.props.bingoGrid.length; n++) {
        if (!this.props.bingoGrid[n][n].validate) return false;
      }
      return true;
    } else if (i + j == this.props.bingoGrid.length - 1) {
      for (let n = 0; n < this.props.bingoGrid.length; n++) {
        if (
          !this.props.bingoGrid[n][this.props.bingoGrid.length - 1 - n].validate
        )
          return false;
      }
      return true;
    }
    return false;
  }

  checkBingo(i, j, validate) {
    if (!this.checkRow(i) || !this.checkCol(j) || this.checkDiagonale(i, j))
      return { backgroundColor: this.props.appConfig.colors.complete };
    if (validate)
      return { backgroundColor: this.props.appConfig.colors.validate };
    return { backgroundColor: this.props.appConfig.colors.blank };
  }

  handleSave = () => {
    this.setState({ edit: false });
    this.props.handleSave();
  };

  render() {
    return (
      <div>
        {this.props.streamer ? (
          <div className="Grid-action">
            {this.state.edit ? (
              <img
                src={saveIcon}
                className="Grid-button"
                alt="Enregistrer"
                onClick={() => this.handleSave()}
              />
            ) : (
              <img
                src={editIcon}
                className="Grid-button"
                alt="Modifier"
                onClick={() => this.setState({ edit: true })}
              />
            )}
            <img
              src={shuffleIcon}
              className="Grid-button"
              alt="Mélanger"
              onClick={() => this.props.handleShuffle()}
            />
            <img
              src={emptyIcon}
              className="Grid-button"
              alt="Réinitialiser"
              onClick={() => this.props.handleReset()}
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
                  className={cell.validate ? "Grid-cell-checked" : "Grid-cell"}
                  key={j}
                  onClick={() => {
                    !this.state.edit &&
                      this.props.streamer &&
                      this.props.handleCheck(i, j);
                  }}
                  style={{
                    ...this.checkBingo(i, j, cell.validate)
                  }}
                >
                  <div className="Grid-title">
                    {this.state.edit ? (
                      <textarea
                        key={i + " " + j}
                        value={cell.values[0]}
                        onChange={event =>
                          this.props.handleChange(i, j, event.target.value)
                        }
                        cols={9}
                        rows={4}
                      />
                    ) : (
                      <span>{cell.values[0]}</span>
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
